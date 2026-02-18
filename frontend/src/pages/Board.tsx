import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useBoardStore } from '../store/boardStore';
import BoardView from '../components/BoardView';
import BottomNav from '../components/BottomNav';
import CreateBoardDialog from '../components/CreateBoardDialog';
import BoardSwitcherDialog from '../components/BoardSwitcherDialog';
import TopBar from '../components/TopBar';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    boards,
    fetchBoards,
    createBoard,
    isSwitcherOpen,
    setIsSwitcherOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
  } = useBoardStore();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async (title: string) => {
    const newBoard = await createBoard(title);
    if (!newBoard) return;
    setIsCreateDialogOpen(false);
    setIsSwitcherOpen(false);
    navigate(`/board/${newBoard.id}`);
  };

  if (!id) return null;

  const currentBoard = boards.find((b) => b.id === id);

  return (
    <div className="min-h-screen w-full bg-[#efe5df] relative">
      <TopBar />
      <div className="border-b-1 mt-2 border-black"></div>
      <BoardView boardId={id} />

      <BottomNav
        onSwitchBoard={() => setIsSwitcherOpen(true)}
        selectedBoardTitle={currentBoard?.title}
      />

      <BoardSwitcherDialog
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        boards={boards}
        currentBoardId={id}
        onCreateNew={() => {
          setIsSwitcherOpen(false);
          setIsCreateDialogOpen(true);
        }}
      />

      <CreateBoardDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateBoard={handleCreateBoard}
      />
    </div>
  );
}
