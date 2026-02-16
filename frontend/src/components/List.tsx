import { useState } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import Button from './Button';
import Task from './Task';
import { type List as ListType } from '../services/listService';
import { type Task as TaskType, taskService } from '../services/taskService';

interface ListProps {
  list: ListType;
  tasks: TaskType[];
  index: number;
  onUpdateList: (list: ListType) => void;
  onDeleteList: (listId: string) => void;
  onCreateTask: (task: TaskType) => void;
  onUpdateTask: (task: TaskType) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function List({
  list,
  tasks,
  index,
  onUpdateList,
  onDeleteList,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: ListProps) {
  const { ref } = useSortable({ id: list.id, index });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsLoading(true);
    try {
      const newTask = await taskService.createTask({
        listId: list.id,
        title: newTaskTitle.trim(),
        position: tasks.length,
      });
      onCreateTask(newTask);
      setNewTaskTitle('');
      setIsAddingTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="flex-shrink-0 w-80 border-4 border-black bg-white"
    >
      {/* List Header */}
      <div className="p-4 border-b-4 border-black">
        <h3 className="text-lg font-bold text-black">{list.title}</h3>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {tasks.map((task, taskIndex) => (
          <Task
            key={task.id}
            task={task}
            index={taskIndex}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}

        {/* Add Task Form */}
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
