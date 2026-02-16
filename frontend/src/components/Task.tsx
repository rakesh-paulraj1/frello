import { useState } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { type Task as TaskType } from '../services/taskService';
import TaskDialog from './TaskDialog';

interface TaskProps {
  task: TaskType;
  index: number;
  onUpdate: (task: TaskType) => void;
  onDelete: (taskId: string) => void;
}

export default function Task({ task, index, onUpdate, onDelete }: TaskProps) {
  const { ref, isDragging } = useSortable({ id: task.id, index });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div
        ref={ref}
        onClick={() => setIsDialogOpen(true)}
        className={`p-3 border-2 border-black bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <h4 className="font-medium text-black">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      <TaskDialog
        task={task}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
}
