import { useState, useEffect, useCallback } from 'react';
import { taskService, type Task } from '../services/taskService';
import { memberService, type BoardMember } from '../services/memberService';
import { Dialog } from './Dialog';
import Button from './Button';

interface TaskDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskDialog({ task, isOpen, onClose, onUpdate, onDelete }: TaskDialogProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [allMembers, setAllMembers] = useState<BoardMember[]>([]);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
  }, [task.id, task.title, task.description]);

  const fetchMembers = useCallback(async () => {
    try {
      const members = await memberService.getAllMembers();
      setAllMembers(members);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
      });
      onUpdate(updatedTask);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(task.id);
        onDelete(task.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleAssignMember = async (memberId: string) => {
    try {
      await taskService.assignTask(task.id, memberId);
      const updatedTask = await taskService.getTask(task.id);
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Failed to assign member:', error);
    }
  };

  const handleUnassignMember = async (memberId: string) => {
    try {
      await taskService.unassignTask(task.id, memberId);
      const updatedTask = await taskService.getTask(task.id);
      onUpdate(updatedTask);
    } catch (error) {
      console.error('Failed to unassign member:', error);
    }
  };

  const toggleMember = (memberId: string) => {
    const isAssigned = task.assignedUsers?.includes(memberId);
    if (isAssigned) {
      handleUnassignMember(memberId);
    } else {
      handleAssignMember(memberId);
    }
  };

  const getMemberColor = (id: string) => {
    const colors = [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-8">
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              {task.assignments?.map((assignment) => (
                <div
                  key={assignment.userId}
                  className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center font-bold text-sm shadow-sm ${getMemberColor(assignment.userId)}`}
                  title={assignment.user.name}
                >
                  {assignment.user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              <div className="relative group">
                <button
                  className="w-10 h-10 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-black hover:text-black transition-all bg-white"
                  title="Manage members"
                >
                  +
                </button>
                <div className="absolute top-12 left-0 w-48 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 hidden group-hover:block z-50">
                   <div className="space-y-1">
                      {allMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center justify-between hover:bg-gray-100 ${
                            task.assignedUsers?.includes(member.id) ? 'font-bold' : ''
                          }`}
                        >
                          {member.name}
                          {task.assignedUsers?.includes(member.id) && (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                   </div>
                </div>
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
                onChange={(e) => setDescription(e.target.value)}
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
                    setDescription(task.description || '');
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
