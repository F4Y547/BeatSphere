import { useEffect, useRef, useState } from 'react';
import { AudioData } from '../types';

export function useAudioAnalyzer(audioElement: HTMLAudioElement | null) {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const timeDataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastBassRef = useRef<number>(0);
  const beatThresholdRef = useRef<number>(1.2); // Sensitivity for beat detection

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaElementSource(audioElement);
    const analyzer = audioContext.createAnalyser();
    
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    analyzerRef.current = analyzer;
    dataArrayRef.current = dataArray;
    timeDataArrayRef.current = timeDataArray;

    const update = () => {
      if (analyzerRef.current && dataArrayRef.current && timeDataArrayRef.current) {
        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
        analyzerRef.current.getByteTimeDomainData(timeDataArrayRef.current);

        // Calculate bands
        const bassRange = dataArrayRef.current.slice(0, 10);
        const midRange = dataArrayRef.current.slice(10, 50);
        const highRange = dataArrayRef.current.slice(50, 100);

        const getAvg = (arr: Uint8Array) => arr.reduce((a, b) => a + b, 0) / arr.length;

        const currentBass = getAvg(bassRange) / 255;
        
        // Simple beat detection: check if current bass is significantly higher than previous
        let isBeat = false;
        if (currentBass > 0.6 && currentBass > lastBassRef.current * beatThresholdRef.current) {
          isBeat = true;
        }
        lastBassRef.current = currentBass;

        setAudioData({
          frequencyData: new Uint8Array(dataArrayRef.current),
          timeDomainData: new Uint8Array(timeDataArrayRef.current),
          bass: currentBass,
          mid: getAvg(midRange) / 255,
          high: getAvg(highRange) / 255,
          avg: getAvg(dataArrayRef.current) / 255,
          isBeat,
        });
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioContext.close();
    };
  }, [audioElement]);

  const resume = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  return { audioData, resume };
}
