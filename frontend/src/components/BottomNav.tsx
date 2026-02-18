interface BottomNavProps {
  onSwitchBoard: () => void;
  selectedBoardTitle?: string;
}

export default function BottomNav({ onSwitchBoard, selectedBoardTitle }: BottomNavProps) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white text-black px-2 py-2 rounded-xl flex items-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
        <div className="px-4 py-1.5 bg-black text-white rounded-lg text-sm font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          {selectedBoardTitle || 'Board'}
        </div>

        <button 
          onClick={onSwitchBoard}
          className="flex items-center gap-2 hover:bg-gray-100 px-4 py-1.5 rounded-lg transition-colors text-sm font-bold border-2 border-transparent hover:border-black"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Switch boards
        </button>
      </div>
    </div>
  );
}
