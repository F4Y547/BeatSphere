export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bass: number;
  mid: number;
  high: number;
  avg: number;
  isBeat: boolean;
}

export type VisualShape = 'sphere' | 'galaxy' | 'tornado' | 'wave' | 'neural';

export interface VisualConfig {
  particleCount: number;
  colorMode: 'auto' | 'gradient' | 'manual';
  primaryColor: string;
  secondaryColor: string;
  shape: VisualShape;
  sensitivity: {
    bass: number;
    mid: number;
    high: number;
  };
  speed: number;
  glowIntensity: number;
  size: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
}
