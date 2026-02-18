import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { boardService, type Board } from '../services/boardService';
import CreateBoardDialog from '../components/CreateBoardDialog';
import Button from '../components/Button';
import TopBar from '../components/TopBar';

export default function Dashboard() {
  const navigate = useNavigate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      const data = await boardService.getBoards();
      const boardList = Array.isArray(data) ? data : [];
      setBoards(boardList);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async (title: string) => {
    try {
      const newBoard = await boardService.createBoard({ title });
      setBoards([...boards, newBoard]);
      setIsCreateDialogOpen(false);
      navigate(`/board/${newBoard.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#efe5df] flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#efe5df]">
      <TopBar />

      <div className="px-18 py-8">
        <div className="border-4 border-black bg-white p-24 min-h-[calc(100vh-200px)]">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Your Boards</h1>
            <Button variant="primary" size="md" onClick={() => setIsCreateDialogOpen(true)}>
              Create Board
            </Button>
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No boards yet. Create your first board to get started!</p>
              <Button variant="primary" size="md" onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Board
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boards.map((board) => {
                const firstLetter = board.title.charAt(0).toUpperCase();
                const restOfTitle = board.title.slice(1);
                
                return (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="border-4 border-black bg-white p-8 cursor-pointer transition-all text-left hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[200px] flex items-center"
                  >
                    <h3 className="text-xl font-bold text-black flex items-start gap-1">
                      <span className="text-7xl leading-none font-black">{firstLetter}</span>
                      <span className="mt-2">{restOfTitle}</span>
                    </h3>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateBoardDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateBoard={handleCreateBoard}
      />
    </div>
  );
}
