import { useSortable } from '@dnd-kit/react/sortable';
import { type Task as TaskType } from '../services/taskService';

interface TaskCardProps {
  task: TaskType;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
  id: task.id,
  index,
  group: task.listId,
  type: 'task',
  accept: ['task'],
  data: { listId: task.listId, type: 'task' },
});

  return (
    <div
      ref={(node) => {
        if (typeof ref === 'function') ref(node);
      }}
      onClick={() => onClick()}
      data-dragging={isDragging}
      className={`border-2 border-black bg-white p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-2 ${isDragging ? 'opacity-80' : ''}`}
    >
      <h4 className="font-medium text-black">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-500 mt-1">
          {task.description.length > 20
            ? `${task.description.substring(0, 20)}...`
            : task.description}
        </p>
      )}

      <div
        ref={(node) => {
          if (typeof handleRef === 'function') handleRef(node);
        }}
        role="button"
        aria-label="Drag task"
        className="ml-auto p-2 cursor-grab hover:bg-gray-100 rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h.01M14 6h.01M10 12h.01M14 12h.01M10 18h.01M14 18h.01" />
        </svg>
      </div>
    </div>
  );
}