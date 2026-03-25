import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'motion/react';
import { Visualizer } from './components/Visualizer';
import { PlayerControls } from './components/PlayerControls';
import { SettingsPanel } from './components/SettingsPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Track, VisualConfig } from './types';
import { Music, X, Maximize2 } from 'lucide-react';
import { cn } from './lib/utils';

const INITIAL_CONFIG: VisualConfig = {
  particleCount: 5000,
  colorMode: 'auto',
  primaryColor: '#1FB6FF',
  secondaryColor: '#A450FF',
  shape: 'sphere',
  sensitivity: {
    bass: 1.5,
    mid: 1.0,
    high: 0.8,
  },
  speed: 1.0,
  glowIntensity: 1.0,
  size: 1.0,
};

const SAMPLE_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Horizon',
    artist: 'SynthWave Pro',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2',
    title: 'Cyber Pulse',
    artist: 'Digital Dream',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  }
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(SAMPLE_TRACKS[0]);
  const [tracks, setTracks] = useState<Track[]>(SAMPLE_TRACKS);
  const [config, setConfig] = useState<VisualConfig>(INITIAL_CONFIG);
  const [progress, setProgress] = useState(0);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [miniSize, setMiniSize] = useState(200);
  const [miniOpacity, setMiniOpacity] = useState(0.8);
  const [isAIMode, setIsAIMode] = useState(false);
  const [activePanel, setActivePanel] = useState<'settings' | 'library' | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { audioData, resume } = useAudioAnalyzer(audioRef.current);

  const handleTogglePiP = async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 300,
          height: 300,
        });

        // Copy styles to PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media.toString();
            link.href = styleSheet.href!;
            pipWindow.document.head.appendChild(link);
          }
        });

        // Create a container in PiP window
        const container = pipWindow.document.createElement('div');
        container.className = 'w-full h-full bg-black overflow-hidden flex items-center justify-center';
        pipWindow.document.body.appendChild(container);

        // We can't easily move the Canvas component, but we can render a simple version
        // For now, let's just show a message or a simplified visualizer if possible
        // Moving complex React trees to PiP windows is tricky without a portal
        container.innerHTML = '<div class="text-white text-center font-display text-sm">BeatSphere PiP Mode<br/><span class="text-xs opacity-50">Visualizer Active</span></div>';
        
      } catch (err) {
        console.error('PiP failed:', err);
      }
    } else {
      // Fallback to internal mini mode
      setIsMiniMode(true);
    }
  };

  // AI Logic: Change shape based on intensity
  useEffect(() => {
    if (isAIMode && audioData) {
      if (audioData.bass > 0.8) {
        setConfig(prev => ({ ...prev, shape: 'sphere' }));
      } else if (audioData.mid > 0.7) {
        setConfig(prev => ({ ...prev, shape: 'galaxy' }));
      } else if (audioData.high > 0.6) {
        setConfig(prev => ({ ...prev, shape: 'tornado' }));
      }
    }
  }, [audioData, isAIMode]);

  useEffect(() => {
    if (audioRef.current) {
      const updateProgress = () => {
        const p = (audioRef.current!.currentTime / audioRef.current!.duration) * 100;
        setProgress(p || 0);
      };
      audioRef.current.addEventListener('timeupdate', updateProgress);
      return () => audioRef.current?.removeEventListener('timeupdate', updateProgress);
    }
  }, [currentTrack]);

  const handleTogglePlay = () => {
    if (audioRef.current) {
      resume();
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIdx = (idx + 1) % tracks.length;
    setCurrentTrack(tracks[nextIdx]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    const prevIdx = (idx - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIdx]);
    setIsPlaying(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newTracks: Track[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        url: URL.createObjectURL(file)
      }));
      setTracks([...tracks, ...newTracks]);
    }
  };

  return (
    <div className="relative w-full h-screen bg-bg-dark overflow-hidden font-sans selection:bg-neon-blue/30">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
      
      {/* Main Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          <Visualizer audioData={audioData} config={config} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={5} 
            maxDistance={20}
            autoRotate={!isPlaying}
            autoRotateSpeed={0.5}
          />
          <EffectComposer>
            <Bloom 
              intensity={config.glowIntensity * 1.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Header Info */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute top-0 left-0 right-0 p-12 flex flex-col items-center z-40 pointer-events-none"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div 
                animate={{ 
                  rotate: isPlaying ? 360 : 0,
                  scale: audioData?.isBeat ? 1.1 : 1
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.1 }
                }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-2xl shadow-neon-blue/40"
              >
                <Music className="text-white" size={24} />
              </motion.div>
              <h1 className="font-display text-4xl tracking-[0.3em] font-bold text-white drop-shadow-2xl">BEATSPHERE</h1>
            </div>
            <motion.div 
              animate={{
                scale: audioData?.isBeat ? 1.02 : 1,
                backgroundColor: audioData?.isBeat ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'
              }}
              className="flex items-center gap-4 px-6 py-3 glass rounded-2xl text-[11px] uppercase tracking-[0.4em] text-white/80 shadow-xl"
            >
              <span className={cn("w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_10px_#1FB6FF]", isPlaying && "animate-pulse")} />
              <span className="font-medium">{currentTrack?.title}</span>
              <span className="text-white/20">/</span>
              <span className="opacity-60">{currentTrack?.artist}</span>
            </motion.div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.url} 
        crossOrigin="anonymous"
        onEnded={handleNext}
        autoPlay={isPlaying}
      />

      {/* UI Panels */}
      <AnimatePresence>
        {activePanel === 'settings' && (
          <SettingsPanel 
            config={config} 
            onChange={setConfig} 
            onClose={() => setActivePanel(null)} 
          />
        )}
        {activePanel === 'library' && (
          <LibraryPanel 
            tracks={tracks} 
            onSelect={(t) => { setCurrentTrack(t); setIsPlaying(true); setActivePanel(null); }} 
            onClose={() => setActivePanel(null)}
            onUpload={handleFileUpload}
          />
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {!isImmersive && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <PlayerControls 
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrev={handlePrev}
              currentTrack={currentTrack}
              progress={progress}
              onSeek={(p) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = (p / 100) * audioRef.current.duration;
                }
              }}
              onOpenSettings={() => setActivePanel('settings')}
              onOpenLibrary={() => setActivePanel('library')}
              onToggleImmersive={() => setIsImmersive(true)}
              onToggleMini={handleTogglePiP}
              onToggleAI={() => setIsAIMode(!isAIMode)}
              isAIMode={isAIMode}
              audioData={audioData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Mode Overlay */}
      <AnimatePresence>
        {isMiniMode && (
          <motion.div 
            drag
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{ 
              width: miniSize, 
              height: miniSize,
              opacity: miniOpacity
            }}
            className="fixed top-20 left-20 glass rounded-full overflow-hidden z-[100] cursor-move shadow-2xl group"
          >
            <div className="absolute inset-0 pointer-events-none">
              <Canvas camera={{ position: [0, 0, 5] }}>
                <Visualizer audioData={audioData} config={{ ...config, particleCount: 1500, size: 0.6 }} />
              </Canvas>
            </div>
            
            {/* Mini Controls Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => setMiniSize(prev => Math.max(150, prev - 50))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70"
                >
                  <span className="text-xs font-bold">-</span>
                </button>
                <button 
                  onClick={() => setMiniSize(prev => Math.min(400, prev + 50))}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70"
                >
                  <span className="text-xs font-bold">+</span>
                </button>
              </div>
              <input 
                type="range" min="0.2" max="1" step="0.1"
                value={miniOpacity}
                onChange={(e) => setMiniOpacity(parseFloat(e.target.value))}
                className="w-20 accent-neon-blue h-1"
              />
              <button 
                onClick={() => setIsMiniMode(false)} 
                className="p-2 bg-neon-blue text-black rounded-full hover:scale-110 transition-transform"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Mode Exit Button */}
      {isImmersive && (
        <button 
          onClick={() => setIsImmersive(false)}
          className="fixed top-8 right-8 p-4 glass rounded-full hover:bg-white/20 transition-all z-[100] animate-in fade-in zoom-in duration-500"
        >
          <Maximize2 size={24} className="rotate-180" />
        </button>
      )}

      {/* Floating Mode Hint */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-[10px] text-white/20 uppercase tracking-[0.3em] pointer-events-none">
        Drag to rotate • Pinch to zoom
      </div>
    </div>
  );
}
