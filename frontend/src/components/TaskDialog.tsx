import { useState, useEffect, useRef } from 'react';
import { taskService, type TaskAssignment } from '../services/taskService';
import { memberService, type BoardMember } from '../services/memberService';
import { Dialog } from './Dialog';
import Button from './Button';
import { useTaskStore } from '../store/taskStore';
import { confirm } from '../store/confirmStore';

export default function TaskDialog() {
  const { selectedTask: task, isTaskDialogOpen: isOpen, closeTaskDialog, updateTask, deleteTask } = useTaskStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const [descriptionOverride, setDescriptionOverride] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<BoardMember[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<TaskAssignment[]>([]);

  const title = titleOverride ?? task?.title ?? '';
  const description = descriptionOverride ?? task?.description ?? '';

  useEffect(() => {
    setTitleOverride(null);
    setDescriptionOverride(null);
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setCurrentAssignments(task?.assignments ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  // Fetch board members when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      try {
        const members = await memberService.getAllMembers();
        if (mounted) setAllMembers(members);
      } catch (error) {
        console.error('Failed to fetch members:', error);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  // Fetch latest task assignments when dialog opens
  useEffect(() => {
    if (!isOpen || !task) return;
    let mounted = true;
    (async () => {
      try {
        const fresh = await taskService.getTask(task.id);
        if (mounted) setCurrentAssignments(fresh.assignments || []);
      } catch (err) {
        console.error('Failed to fetch task assignments:', err);
      }
    })();
    return () => { mounted = false; };
  }, [isOpen, task?.id]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    try {
      await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
      });
      // Sync to store so the board reflects the change immediately
      await updateTask(task.id, { title: title.trim(), description: description.trim() });
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const ok = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (ok) {
      try {
        await deleteTask(task.id);
        closeTaskDialog();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleAssignMember = async (memberId: string) => {
    if (!task) return;
    try {
      await taskService.assignTask(task.id, memberId);
      const updatedTask = await taskService.getTask(task.id);
      setCurrentAssignments(updatedTask.assignments || []);
    } catch (error) {
      console.error('Failed to assign member:', error);
    }
  };

  const handleUnassignMember = async (memberId: string) => {
    if (!task) return;
    try {
      await taskService.unassignTask(task.id, memberId);
      const updatedTask = await taskService.getTask(task.id);
      setCurrentAssignments(updatedTask.assignments || []);
    } catch (error) {
      console.error('Failed to unassign member:', error);
    }
  };

  const toggleMember = (memberId: string) => {
    const assignedIds = new Set(currentAssignments.map((a) => a.userId));
    if (assignedIds.has(memberId)) {
      handleUnassignMember(memberId);
    } else {
      handleAssignMember(memberId);
    }
  };

  // Dropdown state for members picker
  const [membersOpen, setMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const membersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!membersRef.current) return;
      if (!membersRef.current.contains(e.target as Node)) {
        setMembersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMemberColor = (id: string) => {
    const colors = [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Don't render anything if no task is selected
  if (!task) return null;


  return (
    <Dialog isOpen={isOpen} onClose={closeTaskDialog} title="">
      <div className="space-y-8">
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitleOverride(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full text-3xl font-bold text-black border-4 border-black px-4 py-2 focus:outline-none bg-white"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold text-black hover:bg-black/5 px-4 py-2 rounded -ml-4 cursor-pointer transition-colors"
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Double click to edit title"
            >
              {task.title}
            </h1>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Members</span>
            <div className="flex -space-x-2">
              {currentAssignments.map((assignment) => (
                <button
                  key={assignment.userId}
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      message: `Unassign ${assignment.user.name} from this task?`,
                      confirmLabel: 'Unassign',
                      variant: 'warning',
                    });
                    if (ok) handleUnassignMember(assignment.userId);
                  }}
                  title={`Unassign ${assignment.user.name}`}
                  className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-bold text-sm shadow-sm ${getMemberColor(assignment.userId)} cursor-pointer`}
                >
                  {assignment.user.name.charAt(0).toUpperCase()}
                </button>
              ))}
              <div className="relative" ref={membersRef}>
                <button
                  type="button"
                  onClick={() => setMembersOpen((s) => !s)}
                  className="w-10 h-10 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all bg-white"
                  title="Manage members"
                >
                  +
                </button>

                {membersOpen && (
                  <div className="absolute top-12 left-0 w-56 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 z-50">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full px-2 py-1 border-2 border-gray-200 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {allMembers
                        .filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                        .map((member) => {
                          const assignedIds = new Set(currentAssignments.map((a) => a.userId));
                          const isAssigned = assignedIds.has(member.id);
                          return (
                            <button
                              key={member.id}
                              onClick={() => toggleMember(member.id)}
                              className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between hover:bg-gray-100 ${isAssigned ? 'font-bold' : ''}`}
                            >
                              {member.name}
                              {isAssigned && (
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-900">
            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="font-bold text-lg">Description</span>
          </div>

          {isEditingDescription ? (
            <div className="space-y-3">
              <textarea
                value={description}
                onChange={(e) => setDescriptionOverride(e.target.value)}
                className="w-full h-40 border-4 border-black p-4 text-gray-800 focus:outline-none focus:ring-4 focus:ring-black/5 bg-white font-medium shadow-none"
                placeholder="Add a detailed description..."
                autoFocus
              />
              <div className="flex gap-3">
                <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDescriptionOverride(null);
                    setIsEditingDescription(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="p-4 hover:bg-black/5 rounded-lg -ml-4 cursor-pointer transition-colors"
              onDoubleClick={() => setIsEditingDescription(true)}
              title="Double click to edit description"
            >
              {task.description ? (
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{task.description}</p>
              ) : (
                <span className="text-gray-400 font-medium italic">Add a detailed description by double-clicking here...</span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t-4 border-black mt-8">
          <Button
            variant="dashed"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-600 font-bold"
          >
            Delete Task
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
