import { useState } from 'react';
import { type BoardMember } from '../services/memberService';

interface MemberSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  boardMembers: BoardMember[];
  assignedUserIds: string[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
}

export default function MemberSelector({
  isOpen,
  onClose,
  boardMembers,
  assignedUserIds,
  onAssign,
  onUnassign,
}: MemberSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredMembers = boardMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMember = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      onUnassign(userId);
    } else {
      onAssign(userId);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white border-4 border-black p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-black">Members</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black mb-4"
        />

        <div className="max-h-64 overflow-y-auto">
          <div className="text-sm font-medium text-gray-600 mb-2">Board members</div>
          {filteredMembers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No members found</div>
          ) : (
            filteredMembers.map((member) => {
              const isAssigned = assignedUserIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => handleToggleMember(member.id)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer rounded"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-black">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                  {isAssigned && (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
