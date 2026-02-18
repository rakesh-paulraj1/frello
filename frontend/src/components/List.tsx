import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import Button from './Button';
import TaskCard from './TaskCard';
import { type List as ListType } from '../services/listService';
import { type Task as TaskType } from '../services/taskService';
import { useListStore } from '../store/listStore';
import { useTaskStore } from '../store/taskStore';
import { confirm } from '../store/confirmStore';

interface ListProps {
  list: ListType;
  tasks: TaskType[];
  index: number;
}

export default function List({ list, tasks, index }: ListProps) {
  const { updateList, deleteList } = useListStore();
  const { createTask, openTaskDialog, activeGroup, activeDragType } = {
    ...useTaskStore(),
    ...useListStore(),
  };

  const { ref: sortableRef, isDropTarget } = useSortable({
    id: list.id,
    index,
    type: 'column',
    accept: ['column', 'task'],
    collisionPriority: CollisionPriority.Low,
    data: { type: 'column', listId: list.id },
  });

  
  const { setActiveGroup } = useListStore();
  useEffect(() => {
    if (isDropTarget) {
      setActiveGroup(list.id);
    }
  }, [isDropTarget, list.id, setActiveGroup]);

  const isOverTaskArea =
    isDropTarget && (activeDragType === 'task' || activeDragType === null)
      ? activeGroup === list.id || isDropTarget
      : false;

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsLoading(true);
    try {
      await createTask(list.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: TaskType) => {
    openTaskDialog(task);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === list.title) {
      setIsEditingTitle(false);
      setEditedTitle(list.title);
      return;
    }

    await updateList(list.id, { title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  const handleDeleteList = async () => {
    const ok = await confirm({
      title: 'Delete List',
      message: `Are you sure you want to delete "${list.title}" and all its tasks?`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (ok) deleteList(list.id);
  };

  return (
    <div
      ref={(node) => {
        if (typeof sortableRef === 'function') sortableRef(node);
      }}
      className={`flex-shrink-0 w-80 border-4 border-black bg-white transition-colors ${isOverTaskArea ? 'ring-4 ring-black ring-inset bg-gray-50' : ''}`}
    >
      <div className="p-4 border-b-4 border-black flex items-center justify-between group">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setIsEditingTitle(false);
                setEditedTitle(list.title);
              }
            }}
            className="text-lg font-bold text-black border-2 border-black px-2 py-0.5 w-full focus:outline-none bg-white"
            autoFocus
          />
        ) : (
          <>
            <h3
              className="text-lg font-bold text-black cursor-pointer hover:bg-black/5 px-1 rounded transition-colors flex-1"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double click to edit title"
            >
              {list.title}
            </h3>
            <button
              onClick={handleDeleteList}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-600 rounded transition-all"
              title="Delete list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className={`p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto transition-all duration-300 min-h-[100px] ${isOverTaskArea ? 'pb-24' : 'pb-4'}`}>
        {tasks.map((task, taskIndex) => (
          <TaskCard
            key={task.id}
            task={task}
            index={taskIndex}
            onClick={() => handleTaskClick(task)}
          />
        ))}
        {isOverTaskArea && (
          <div className="border-2 border-dashed border-black/10 bg-black/[0.02] h-20 rounded-lg flex items-center justify-center transition-all animate-in fade-in zoom-in duration-300">
            <span className="text-gray-400 text-sm font-medium">Drop here</span>
          </div>
        )}

        {isAddingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isLoading || !newTaskTitle.trim()}
              >
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="dashed"
            size="sm"
            className="w-full"
            onClick={() => setIsAddingTask(true)}
          >
            + Add Task
          </Button>
        )}
      </div>
    </div>
  );
}
