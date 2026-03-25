import React from 'react';
import { X, Music, Search, FolderOpen } from 'lucide-react';
import { Track } from '../types';

interface LibraryPanelProps {
  tracks: Track[];
  onSelect: (track: Track) => void;
  onClose: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ tracks, onSelect, onClose, onUpload }) => {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-80 glass z-[60] p-6 flex flex-col gap-6 animate-in slide-in-from-left duration-300">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl flex items-center gap-2">
          <Music className="text-neon-purple" size={20} />
          Library
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
        <input 
          type="text" 
          placeholder="Search tracks..."
          className="w-full bg-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-neon-purple transition-all"
        />
      </div>

      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-neon-purple/50 hover:bg-neon-purple/5 cursor-pointer transition-all group">
        <FolderOpen className="text-white/30 group-hover:text-neon-purple" size={20} />
        <span className="text-sm text-white/50 group-hover:text-white">Import Local Files</span>
        <input type="file" className="hidden" accept="audio/*" multiple onChange={onUpload} />
      </label>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {tracks.length === 0 ? (
          <div className="text-center py-10 text-white/30 text-sm italic">
            No tracks found. Import some music to get started!
          </div>
        ) : (
          tracks.map(track => (
            <button
              key={track.id}
              onClick={() => onSelect(track)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors">
                <Music size={18} className="text-white/30 group-hover:text-neon-purple" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate group-hover:text-neon-purple transition-colors">{track.title}</span>
                <span className="text-xs text-white/40 truncate">{track.artist}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
