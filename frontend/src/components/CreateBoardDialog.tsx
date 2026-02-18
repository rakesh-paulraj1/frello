import { useState } from 'react';
import Button from './Button';

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (title: string) => Promise<void>;
}

export default function CreateBoardDialog({ isOpen, onClose, onCreateBoard }: CreateBoardDialogProps) {
  const [boardTitle, setBoardTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onCreateBoard(boardTitle.trim());
      setBoardTitle('');
      onClose();
    } catch {
      setError('Failed to create board. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setBoardTitle('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border-4 border-black p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-black mb-6">Create New Board</h2>
        
        {error && (
          <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Board Title
            </label>
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              placeholder="Enter board title"
              className="w-full px-4 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="md"
              onClick={handleClose}
              type="button"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isLoading || !boardTitle.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
