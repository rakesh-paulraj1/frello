import { useState } from 'react';
import Button from './Button';
import { type Task, taskService } from '../services/taskService';

interface TaskDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDialog({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        listId: task.listId,
        position: task.position,
      });
      onUpdate(updatedTask);
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await taskService.deleteTask(task.id);
      onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white border-4 border-black p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Task Details</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isLoading || isDeleting}
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Add a description..."
              disabled={isLoading || isDeleting}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-between">
          <Button
            variant="secondary"
            size="md"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isLoading || isDeleting || !title.trim()}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
