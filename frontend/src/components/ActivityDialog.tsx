import { useState, useEffect, useCallback } from 'react';
import { activityService, type ActivityLog, type ActivityMetadata } from '../services/activityService';
import { Dialog } from './Dialog';

interface ActivityDialogProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PER_PAGE = 8;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildMessage(
  actionType: string | undefined,
  entityType: string | undefined,
  metadata: ActivityMetadata | null,
): string {
  const action = (actionType ?? 'UNKNOWN').toUpperCase();
  const entity = (entityType ?? 'item').toLowerCase();

  const entityTitle = metadata?.taskTitle ?? metadata?.listTitle ?? metadata?.title;
  const quoted = entityTitle ? `"${entityTitle}"` : null;

  switch (action) {
    case 'CREATED':
      return quoted ? `Created ${entity} ${quoted}` : `Created a ${entity}`;
    case 'UPDATED':
      return quoted ? `Updated ${entity} ${quoted}` : `Updated a ${entity}`;
    case 'DELETED':
      return quoted ? `Deleted ${entity} ${quoted}` : `Deleted a ${entity}`;
    case 'MOVED': {
      if (entity === 'task') {
        const taskName = quoted ?? 'a task';
        const from = metadata?.fromListTitle
          ? `"${metadata.fromListTitle}"`
          : metadata?.fromListId ? `list …${metadata.fromListId.slice(-4)}` : 'a list';
        const to = metadata?.toListTitle
          ? `"${metadata.toListTitle}"`
          : metadata?.toListId ? `list …${metadata.toListId.slice(-4)}` : 'another list';
        return `Moved task ${taskName} from ${from} to ${to}`;
      }
      const listName = quoted ?? 'a list';
      const from = metadata?.from !== undefined ? `position ${metadata.from}` : 'a position';
      const to = metadata?.to !== undefined ? `position ${metadata.to}` : 'another position';
      return `Reordered ${listName} from ${from} to ${to}`;
    }
    case 'ASSIGNED':
      return quoted ? `Assigned member to ${entity} ${quoted}` : `Assigned member to a ${entity}`;
    case 'UNASSIGNED':
      return quoted ? `Unassigned member from ${entity} ${quoted}` : `Unassigned member from a ${entity}`;
    default:
      return quoted ? `${action} ${entity} ${quoted}` : `${action} a ${entity}`;
  }
}

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700 border-green-300',
  UPDATED: 'bg-blue-100 text-blue-700 border-blue-300',
  DELETED: 'bg-red-100 text-red-700 border-red-300',
  MOVED: 'bg-purple-100 text-purple-700 border-purple-300',
  ASSIGNED: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  UNASSIGNED: 'bg-orange-100 text-orange-700 border-orange-300',
};

function ActionBadge({ actionType }: { actionType?: string }) {
  const key = (actionType ?? '').toUpperCase();
  const cls = ACTION_COLORS[key] ?? 'bg-gray-100 text-gray-500 border-gray-300';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded flex-shrink-0 ${cls}`}>
      {actionType ?? '—'}
    </span>
  );
}

export default function ActivityDialog({ boardId, isOpen, onClose }: ActivityDialogProps) {
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activityService.getLogs(boardId, 0, 500);
      setAllLogs(data);
    } catch {
      setError('Failed to load activity log.');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(0);
    setAllLogs([]);
    fetchAll();
  }, [isOpen, fetchAll]);

  const totalPages = Math.max(1, Math.ceil(allLogs.length / PER_PAGE));
  const visibleLogs = allLogs.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Activity Log">
      <div className="w-[500px] max-w-full flex flex-col" style={{ minHeight: '420px' }}>
        {error && (
          <div className="mb-4 text-sm text-red-600 font-medium border border-red-200 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-gray-400 animate-pulse">Loading…</span>
            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-400 text-sm">No activity yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visibleLogs.map((log) => {
                const message = buildMessage(log.actionType, log.entityType, log.metadata);
                return (
                  <li key={log.id} className="flex items-start gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                      {log.user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm text-black">{log.user?.name ?? 'Unknown'}</span>
                        <ActionBadge actionType={log.actionType} />
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {allLogs.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-black gap-2">
            {/* Prev arrow */}
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!canGoPrev}
              className="flex items-center gap-1 text-sm font-bold px-2 py-1.5 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors flex-shrink-0"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 text-sm font-bold border-2 transition-colors ${
                    i === page
                      ? 'bg-black text-white border-black'
                      : 'border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Next arrow */}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canGoNext}
              className="flex items-center gap-1 text-sm font-bold px-2 py-1.5 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors flex-shrink-0"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
