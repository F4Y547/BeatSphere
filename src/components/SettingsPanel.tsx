import React from 'react';
import { X, Sliders, Palette, Zap, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { VisualConfig, VisualShape } from '../types';

interface SettingsPanelProps {
  config: VisualConfig;
  onChange: (config: VisualConfig) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg p-10 glass-dark rounded-[48px] z-[60] shadow-2xl"
    >
      <div className="flex items-center justify-between mb-10">
        <h2 className="font-display text-2xl font-bold tracking-tight">Settings</h2>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
        {/* Performance Mode */}
        <div className="flex items-center justify-between p-6 glass rounded-[32px]">
          <div className="flex items-center gap-4">
            <Cpu className="text-white/40" size={20} />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Performance Mode</span>
              <span className="text-[10px] text-white/40">Optimized for mobile & older devices</span>
            </div>
          </div>
          <button 
            onClick={() => onChange({ 
              ...config, 
              particleCount: config.particleCount > 5000 ? 3000 : 10000 
            })}
            className={cn(
              "w-12 h-6 rounded-full transition-all relative",
              config.particleCount <= 5000 ? "bg-white" : "bg-white/10"
            )}
          >
            <motion.div 
              animate={{ x: config.particleCount <= 5000 ? 24 : 4 }}
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full",
                config.particleCount <= 5000 ? "bg-black" : "bg-white/40"
              )}
            />
          </button>
        </div>

        {/* Shape Selection */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Visualization Shape</label>
          <div className="grid grid-cols-3 gap-3">
            {(['sphere', 'galaxy', 'tornado', 'wave', 'neural'] as VisualShape[]).map((s) => (
              <button
                key={s}
                onClick={() => onChange({ ...config, shape: s })}
                className={cn(
                  "py-4 rounded-2xl text-xs capitalize font-medium transition-all",
                  config.shape === s ? "bg-white text-black shadow-lg" : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Particle Count</span>
              <span>{config.particleCount}</span>
            </div>
            <input 
              type="range" min="1000" max="20000" step="1000"
              value={config.particleCount}
              onChange={(e) => onChange({ ...config, particleCount: parseInt(e.target.value) })}
              className="w-full ios-slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Speed</span>
              <span>{config.speed.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="0.1" max="5" step="0.1"
              value={config.speed}
              onChange={(e) => onChange({ ...config, speed: parseFloat(e.target.value) })}
              className="w-full ios-slider"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
