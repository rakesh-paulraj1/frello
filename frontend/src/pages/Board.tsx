import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { DragDropProvider } from '@dnd-kit/react';
import { boardService, type Board } from '../services/boardService';
import { listService, type List as ListType } from '../services/listService';
import { type Task as TaskType } from '../services/taskService';
import Button from '../components/Button';
import List from '../components/List';

interface BoardData extends Board {
  lists: (ListType & { tasks: TaskType[] })[];
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  useEffect(() => {
    if (id) {
      fetchBoard(id);
    }
  }, [id]);

  const fetchBoard = async (boardId: string) => {
    try {
      const boardData = await boardService.getBoard(boardId);
      // In a real app, you'd fetch lists and tasks here
      // For now, initialize with empty lists
      setBoard({ ...boardData, lists: [] });
    } catch (error) {
      console.error('Failed to fetch board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !board) return;

    try {
      const newList = await listService.createList({
        boardId: board.id,
        title: newListTitle.trim(),
        position: board.lists.length,
      });
      setBoard({
        ...board,
        lists: [...board.lists, { ...newList, tasks: [] }],
      });
      setNewListTitle('');
      setIsAddingList(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleCreateTask = (listId: string, task: TaskType) => {
    if (!board) return;
    setBoard({
      ...board,
      lists: board.lists.map((list) =>
        list.id === listId
          ? { ...list, tasks: [...list.tasks, task] }
          : list
      ),
    });
  };

  const handleUpdateTask = (task: TaskType) => {
    if (!board) return;
    setBoard({
      ...board,
      lists: board.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((t) => (t.id === task.id ? task : t)),
      })),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!board) return;
    setBoard({
      ...board,
      lists: board.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((t) => t.id !== taskId),
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#efe5df] flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading board...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen w-full bg-[#efe5df] flex items-center justify-center">
        <div className="text-xl text-gray-700">Board not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#efe5df]">
      {/* Board Header */}
      <div className="px-11 pt-8">
        <div className="border-4 border-black bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black">{board.title}</h1>
            <Button variant="dashed" size="md" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Lists Container */}
      <div className="px-11 py-8">
        <DragDropProvider>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {board.lists.map((list, index) => (
              <List
                key={list.id}
                list={list}
                tasks={list.tasks}
                index={index}
                onUpdateList={(updatedList) => {
                  setBoard({
                    ...board,
                    lists: board.lists.map((l) =>
                      l.id === updatedList.id ? { ...updatedList, tasks: l.tasks } : l
                    ),
                  });
                }}
                onDeleteList={(listId) => {
                  setBoard({
                    ...board,
                    lists: board.lists.filter((l) => l.id !== listId),
                  });
                }}
                onCreateTask={(task) => handleCreateTask(list.id, task)}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}

            {/* Add List */}
            <div className="flex-shrink-0 w-80">
              {isAddingList ? (
                <form onSubmit={handleAddList} className="border-4 border-black bg-white p-4 space-y-3">
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" type="submit">
                      Add List
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle('');
                      }}
                      type="button"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="dashed"
                  size="md"
                  onClick={() => setIsAddingList(true)}
                >
                  + Add List
                </Button>
              )}
            </div>
          </div>
        </DragDropProvider>
      </div>
    </div>
  );
}
