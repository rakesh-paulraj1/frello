import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import CreateBoardDialog from '../components/CreateBoardDialog';
import { boardService, type Board } from '../services/boardService';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const data = await boardService.getBoards();
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (title: string) => {
    const newBoard = await boardService.createBoard({ title });
    setBoards([...boards, newBoard]);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full bg-[#efe5df]">
      {/* Top Navigation Bar */}
      <div className="px-11 pt-8">
        <div className="border-4 border-black bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">Frello</h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <Button variant="dashed" size="md" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-11 py-8">
        <div className="border-4 border-black bg-white p-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-black">Your Boards</h1>
            <Button variant="primary" size="md" onClick={() => setIsDialogOpen(true)}>
              Create Board
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading boards...</div>
          ) : boards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No boards yet. Create your first board to get started!</p>
              <Button variant="primary" size="md" onClick={() => setIsDialogOpen(true)}>
                Create Your First Board
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="border-4 border-black bg-white p-6 hover:bg-gray-50 transition-colors text-left"
                >
                  <h3 className="text-xl font-bold text-black">{board.title}</h3>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateBoardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateBoard={handleCreateBoard}
      />
    </div>
  );
}
