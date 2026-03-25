import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings, Music, Brain, Layout, Maximize2, VolumeX, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Track, AudioData } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTrack: Track | null;
  progress: number;
  onSeek: (val: number) => void;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onToggleImmersive: () => void;
  onToggleMini: () => void;
  onToggleAI: () => void;
  isAIMode: boolean;
  audioData: AudioData | null;
}

export const PlayerControls: React.FC<ControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentTrack,
  progress,
  onSeek,
  onOpenSettings,
  onOpenLibrary,
  onToggleImmersive,
  onToggleMini,
  onToggleAI,
  isAIMode,
  audioData
}) => {
  const isBeat = audioData?.isBeat || false;
  const [volume, setVolume] = useState(80);
  const [showVolume, setShowVolume] = useState(false);

  return (
    <motion.div 
      animate={{
        y: 0,
        opacity: 1,
        backgroundColor: isBeat ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: isBeat ? 'blur(80px)' : 'blur(40px)',
        borderColor: isBeat ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isBeat 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.1)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transition: { duration: 0.15 }
      }}
      initial={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[94%] md:w-[92%] max-w-6xl p-4 md:p-8 glass rounded-[32px] md:rounded-[40px] flex flex-col gap-4 md:gap-6 items-center z-50 border shadow-2xl"
    >
      {/* Progress Bar */}
      <div className="w-full group relative h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden transition-all hover:h-2.5"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const x = e.clientX - rect.left;
             onSeek((x / rect.width) * 100);
           }}>
        <motion.div 
          animate={{
            boxShadow: isBeat ? '0 0 30px rgba(255, 255, 255, 0.5)' : '0 0 10px rgba(255, 255, 255, 0.2)',
          }}
          className="absolute top-0 left-0 h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full flex items-center justify-between gap-4 md:gap-12">
        {/* Track Info */}
        <div className="flex items-center gap-3 md:gap-5 w-1/3 md:w-1/4 min-w-0">
          <motion.div 
            animate={{
              scale: isBeat ? 1.08 : 1,
              borderColor: isBeat ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
            }}
            className="w-10 h-10 md:w-16 md:h-16 rounded-[12px] md:rounded-[24px] bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0 shadow-inner"
          >
            <Music className="text-white/80" size={20} />
          </motion.div>
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-display text-xs md:text-lg truncate text-white font-bold tracking-tight">{currentTrack?.title || 'Select Track'}</h3>
            <p className="text-[8px] md:text-[11px] uppercase tracking-[0.2em] text-white/40 truncate font-medium">{currentTrack?.artist || 'Unknown'}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4 md:gap-10">
          <button onClick={onPrev} className="p-2 md:p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90">
            <SkipBack size={24} className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
          </button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: isBeat ? 1.12 : 1,
              boxShadow: isBeat ? '0 0 50px rgba(255, 255, 255, 0.2)' : '0 0 0px rgba(255, 255, 255, 0)',
            }}
            onClick={onTogglePlay}
            className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-transform"
          >
            {isPlaying ? <Pause size={40} className="w-6 h-6 md:w-10 md:h-10" fill="currentColor" /> : <Play size={40} className="w-6 h-6 md:w-10 md:h-10 ml-1 md:ml-2" fill="currentColor" />}
          </motion.button>
          <button onClick={onNext} className="p-2 md:p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90">
            <SkipForward size={24} className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
          </button>
        </div>

        {/* Action Buttons & Volume */}
        <div className="flex items-center justify-end gap-1 md:gap-3 w-1/3 md:w-1/4">
          <div className="relative hidden md:flex items-center">
            <AnimatePresence>
              {showVolume && (
                <motion.div 
                  initial={{ width: 0, opacity: 0, x: 20 }}
                  animate={{ width: 120, opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: 20 }}
                  className="absolute right-full mr-4 flex items-center px-4 py-2 glass rounded-2xl border border-white/10"
                >
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full ios-slider"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowVolume(!showVolume)}
              className="p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
            >
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <button 
            onClick={() => onToggleAI()} 
            className={cn(
              "p-2 md:p-4 rounded-xl md:rounded-2xl transition-all", 
              isAIMode ? "bg-white/20 text-white" : "text-white/30 hover:text-white hover:bg-white/10"
            )}
            title="AI Mode"
          >
            <Brain size={20} className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'BeatSphere',
                    text: 'Check out this amazing 3D Music Visualizer!',
                    url: window.location.href,
                  });
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }
            }}
            className="p-2 md:p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-xl md:rounded-2xl transition-all"
            title="Share"
          >
            <Share2 size={20} className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
          <button onClick={onOpenSettings} className="p-2 md:p-4 text-white/30 hover:text-white hover:bg-white/10 rounded-xl md:rounded-2xl transition-all" title="Settings">
            <Settings size={20} className="w-4.5 h-4.5 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
