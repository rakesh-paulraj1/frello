import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import { useBoardStore } from '../store/boardStore';
import { useListStore } from '../store/listStore';
import { useTaskStore } from '../store/taskStore';
import Button from './Button';
import List from './List';
import TaskDialog from './TaskDialog';
import ActivityDialog from './ActivityDialog';
import { useBoardSocket } from '../hooks/useBoardSocket';
import { taskService } from '../services/taskService';
import { useDebounce } from '../hooks/useDebounce';

interface BoardViewProps {
  boardId: string;
}

export default function BoardView({ boardId }: BoardViewProps) {
  const navigate = useNavigate();
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  useBoardSocket(boardId);

  const { openTaskDialog } = useTaskStore();
  const [searchResults, setSearchResults] = useState<import('../services/taskService').Task[]>([]);

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const tasks = await taskService.searchTasks(boardId, debouncedQuery);
        setSearchResults(tasks);
      } catch {
        setSearchResults([]);
      }
    }
    search();
  }, [debouncedQuery, boardId]);


  const {
    currentBoard,
    isLoading: isBoardLoading,
    error: boardError,
    fetchBoard,
    updateBoard,
    clearError,
    isEditingBoardTitle,
    editedBoardTitle,
    setIsEditingBoardTitle,
    setEditedBoardTitle,
  } = useBoardStore();

  const {
    lists,
    createList,
    reorderList,
    activeDragType,
    setActiveGroup,
    setActiveDragType,
    resetDragState,
    isAddingList,
    newListTitle,
    setIsAddingList,
    setNewListTitle,
  } = useListStore();


  const {
    tasks: tasksMap,
    moveTask,
    handleDragOver: handleTaskDragOver,
  } = useTaskStore();

  const isLoading = isBoardLoading;
  const error = boardError;

  const dragStartRef = useRef<{ id: string; listId: string; index: number } | null>(null);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  useEffect(() => {
    if (currentBoard) {
      setEditedBoardTitle(currentBoard.title);
    }

  }, [currentBoard?.id, currentBoard?.title]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  
  const handleDragStart = (event: any) => {
    console.log('🎯 Drag Start Event:', event);
    const source = event?.operation?.source;
    if (!source) return;

    const group = source.data?.group ?? source.data?.listId ?? null;
    const type = source.data?.type ?? null;
    console.log('Active Group:', group, 'Type:', type);
    setActiveGroup(group);
    setActiveDragType(type);

    try {
      dragStartRef.current = {
        id: String(source.id),
        listId: String(group ?? ''),
        index: Number(source.index ?? source.initialIndex ?? -1),
      };
    } catch (err) {
      dragStartRef.current = null;
    }
  };

  
  const handleDragEnd = async (event: any) => {
    console.log('🎯 Drag End Event:', event);
    const { operation, canceled } = event;

    if (canceled || !operation) {
      console.log('❌ Drag canceled or no operation');
      resetDragState();
      dragStartRef.current = null;
      return;
    }

    const { source } = operation;

    if (!isSortable(source)) {
      console.log('❌ Source is not sortable');
      resetDragState();
      dragStartRef.current = null;
      return;
    }

    const { initialIndex, index, group, data, id } = source as any;
    const sourceId = String(id);

    if (data?.type === 'column') {
      console.log('📋 Reordering list');
      if (!currentBoard) {
        resetDragState();
        dragStartRef.current = null;
        return;
      }

      const originalIndex = Number(dragStartRef.current?.index ?? initialIndex ?? -1);
      if (originalIndex === index) {
        console.log('❌ List position unchanged');
        resetDragState();
        dragStartRef.current = null;
        return;
      }

      console.log(`Moving list from index ${originalIndex} to ${index}`);
      await reorderList(sourceId, index);
      resetDragState();
      dragStartRef.current = null;
      return;
    }

    console.log('📝 Moving task');

    const initialGroup = (source as any).initialGroup ?? null;
    const fromListId = String(dragStartRef.current?.listId ?? initialGroup ?? '');
    const originalIndex = Number(dragStartRef.current?.index ?? initialIndex ?? -1);
    const toListId = String(group ?? '');
    const toIndex = Number(index);

    if (!fromListId || !toListId || !currentBoard) {
      console.log('❌ Missing list IDs or board');
      resetDragState();
      dragStartRef.current = null;
      return;
    }

    if (originalIndex === toIndex && fromListId === toListId) {
      console.log('❌ Same index and same list — nothing to persist');
      resetDragState();
      dragStartRef.current = null;
      return;
    }

    console.log(`Task ${sourceId} from list ${fromListId} to list ${toListId} at position ${toIndex}`);
    await moveTask(sourceId, fromListId, toListId, toIndex);
    resetDragState();
    dragStartRef.current = null;
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !currentBoard) return;

    await createList(boardId, newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleUpdateBoardTitle = async () => {
    if (!currentBoard || !editedBoardTitle.trim() || editedBoardTitle === currentBoard.title) {
      setIsEditingBoardTitle(false);
      setEditedBoardTitle(currentBoard?.title || '');
      return;
    }

    await updateBoard(currentBoard.id, { title: editedBoardTitle.trim() });
    setIsEditingBoardTitle(false);
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading board...</div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xl text-gray-700">Board not found or deleted</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 mx-6 mt-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="font-bold text-xl">&times;</button>
        </div>
      )}
      
      <div className="flex-1 overflow-x-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/50 transition-colors rounded border-2 border-black bg-white"
            aria-label="Go back to dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {isEditingBoardTitle ? (
            <input
              type="text"
              value={editedBoardTitle}
              onChange={(e) => setEditedBoardTitle(e.target.value)}
              onBlur={handleUpdateBoardTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateBoardTitle();
                if (e.key === 'Escape') {
                  setIsEditingBoardTitle(false);
                  setEditedBoardTitle(currentBoard.title);
                }
              }}
              className="text-2xl font-bold text-black border-2 border-black px-2 py-1 focus:outline-none bg-white"
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold text-black hover:bg-black/5 px-2 py-1 rounded cursor-pointer transition-colors"
              onDoubleClick={() => setIsEditingBoardTitle(true)}
              title="Double click to edit"
            >
              {currentBoard.title}
            </h1>
          )}

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-auto px-4">
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-0 bg-white transition-all placeholder-gray-400 font-medium"
                />
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    {searchResults.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          openTaskDialog(task);
                          setSearchQuery(''); // Close search on selection
                          setSearchResults([]);
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                      >
                        <div className="font-medium text-black">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{task.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

          <button
            onClick={() => setIsActivityOpen(true)}
            className="ml-auto p-2 hover:bg-white/60 transition-colors rounded border-2 border-black bg-white flex-shrink-0"
            title="View activity log"
            aria-label="Open activity log"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        <div className="flex gap-6 h-full items-start">
          <DragDropProvider
            onDragStart={handleDragStart}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onDragOver={(event: any) => {
              if (event.active?.data?.current?.type === 'task' || activeDragType === 'task') {
                handleTaskDragOver(event);
              }
            }}
            onDragEnd={handleDragEnd}
          >
            {lists.map((list, index) => (
              <List
                key={list.id}
                list={list}
                tasks={tasksMap[list.id] || []}
                index={index}
              />
            ))}
          </DragDropProvider>

          <TaskDialog />

        
          <ActivityDialog
            boardId={boardId}
            isOpen={isActivityOpen}
            onClose={() => setIsActivityOpen(false)}
          />

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
                    onClick={() => { setIsAddingList(false); setNewListTitle(''); }}
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
                className="w-full text-left justify-start"
              >
                + Add another list
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
