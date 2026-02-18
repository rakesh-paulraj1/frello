import { useNavigate } from 'react-router';
import { type Board } from '../services/boardService';
import { Dialog } from './Dialog';
import Button from './Button';

interface BoardSwitcherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boards: Board[];
  currentBoardId: string;
  onCreateNew: () => void;
}

export default function BoardSwitcherDialog({
  isOpen,
  onClose,
  boards,
  currentBoardId,
  onCreateNew,
}: BoardSwitcherDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Switch Board">
      <div className="space-y-2 max-h-[60vh] overflow-y-auto mb-6">
        <button
          onClick={() => {
            navigate('/dashboard');
            onClose();
          }}
          className="w-full text-left px-4 py-3 rounded border-2 border-transparent hover:bg-gray-100 text-gray-700 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Back to Dashboard
        </button>
        <div className="h-px bg-gray-200 my-2"></div>
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => {
              navigate(`/board/${board.id}`);
              onClose();
            }}
            className={`w-full text-left px-4 py-3 rounded border-2 transition-all ${
              currentBoardId === board.id
                ? 'border-black bg-black text-white font-medium'
                : 'border-transparent hover:bg-gray-100 text-gray-700'
            }`}
          >
            {board.title}
          </button>
        ))}
      </div>

      <Button
        variant="dashed"
        size="md"
        className="w-full justify-center"
        onClick={onCreateNew}
      >
        + Create New Board
      </Button>
    </Dialog>
  );
}
