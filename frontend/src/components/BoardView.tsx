import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DragDropProvider } from '@dnd-kit/react';

import { isSortable } from '@dnd-kit/react/sortable';
import { useBoardStore } from '../store/boardStore';
import { useListStore } from '../store/listStore';
import { useTaskStore } from '../store/taskStore';
import Button from './Button';
import List from './List';

interface BoardViewProps {
  boardId: string;
}



export default function BoardView({ boardId }: BoardViewProps) {
  const navigate = useNavigate();
  const { 
    currentBoard, 
    isLoading: isBoardLoading, 
    error: boardError,
    fetchBoard, 
    updateBoard,
    clearError
  } = useBoardStore();

  const {
    lists,
    createList,
    reorderList,
  } = useListStore();

  const {
    tasks: tasksMap,
    moveTask,
    handleDragOver: handleTaskDragOver,
  } = useTaskStore();

  const isLoading = isBoardLoading;
  const error = boardError;

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  // Initialize edited title when board loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentBoard) {
      setEditedTitle(currentBoard.title);
    }
  }, [currentBoard?.id, currentBoard?.title]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragStart = (event: any) => {
    console.log('🎯 Drag Start Event:', event);
    const source = event?.operation?.source;
    if (!source) return;
    
    // Get group from source data for visual feedback
    const group = source.data?.group ?? source.data?.listId ?? null;
    const type = source.data?.type ?? null;
    console.log('Active Group:', group, 'Type:', type);
    setActiveGroup(group);
    setActiveDragType(type);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = async (event: any) => {
    console.log('🎯 Drag End Event:', event);
    const { operation, canceled } = event;
    
    if (canceled || !operation) {
      console.log('❌ Drag canceled or no operation');
      setActiveGroup(null);
      return;
    }

    const { source } = operation;
    
   
    if (!isSortable(source)) {
      console.log('❌ Source is not sortable');
      setActiveGroup(null);
      return;
    }

    

    const { initialIndex, index, initialGroup, group, data, id } = source;
    const sourceId = String(id);

    
    if (data?.type === 'column') {
      console.log('📋 Reordering list');
      if (!currentBoard) {
        setActiveGroup(null);
        return;
      }

      
      if (initialIndex === index) {
        console.log('❌ List position unchanged');
        setActiveGroup(null);
        return;
      }

      console.log(`Moving list from index ${initialIndex} to ${index}`);
      console.log('🚀 Calling reorderList API');
      
      await reorderList(sourceId, index);
      setActiveGroup(null);
      return;
    }

    
    console.log('📝 Moving task');
    const fromListId = String(initialGroup ?? '');
    const toListId = String(group ?? '');

    if (!fromListId || !toListId || !currentBoard) {
      console.log('❌ Missing list IDs or board');
      setActiveGroup(null);
      return;
    }

    console.log(`Task ${sourceId} from list ${fromListId} to list ${toListId} at position ${index}`);
    console.log('🚀 Calling moveTask API');

    // If task reordered within same list or moved across lists, persist via moveTask
    if (initialIndex === index && fromListId === toListId) {
      console.log('❌ Same index and same list — nothing to persist');
      setActiveGroup(null);
      setActiveDragType(null);
      return;
    }

    await moveTask(sourceId, fromListId, toListId, index);
    setActiveGroup(null);
    setActiveDragType(null);
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !currentBoard) return;

    await createList(boardId, newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  const handleUpdateBoardTitle = async () => {
    if (!currentBoard || !editedTitle.trim() || editedTitle === currentBoard.title) {
      setIsEditingTitle(false);
      setEditedTitle(currentBoard?.title || '');
      return;
    }

    await updateBoard(currentBoard.id, { title: editedTitle.trim() });
    setIsEditingTitle(false);
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
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleUpdateBoardTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateBoardTitle();
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setEditedTitle(currentBoard.title);
                }
              }}
              className="text-2xl font-bold text-black border-2 border-black px-2 py-1 focus:outline-none bg-white"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-black hover:bg-black/5 px-2 py-1 rounded cursor-pointer transition-colors"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double click to edit"
            >
              {currentBoard.title}
            </h1>
          )}
        </div>

        <div className="flex gap-6 h-full items-start">
          <DragDropProvider
            onDragStart={handleDragStart}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onDragOver={(event: any) => {
              // Only handle task drag over for optimistic updates
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
                  activeGroup={activeGroup}
                  activeDragType={activeDragType}
                  onOverChange={(id, isOver) => setActiveGroup(isOver ? id : activeGroup)}
                />
              ))}
            
          </DragDropProvider>
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
