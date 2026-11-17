import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

/**
 * Canvas spectrum visualizer driven by the Web Audio AnalyserNode.
 * Falls back to a gentle idle animation before audio starts.
 */
export default function Visualizer({ className, bars = 48, compact = false }) {
  const { analyserRef, isPlaying, settings } = useApp();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const reduced = settings.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let data = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const readColor = (variable, fallback) => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
      return raw ? `rgb(${raw.split(/\s+/).join(', ')})` : fallback;
    };
    const accent = readColor('--accent', '#2dd4bf');
    const accent2 = readColor('--accent-2', '#8b5cf6');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const draw = (time) => {
      resize();
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (analyser && !data) data = new Uint8Array(analyser.frequencyBinCount);
      if (analyser && data) analyser.getByteFrequencyData(data);

      const count = Math.max(12, bars);
      const gap = compact ? 2 * dpr : 3 * dpr;
      const barWidth = Math.max(1.5 * dpr, (width - gap * (count - 1)) / count);
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, accent2);
      gradient.addColorStop(1, accent);
      ctx.fillStyle = gradient;

      const active = Boolean(isPlaying && analyser);
      for (let i = 0; i < count; i += 1) {
        let normalized = 0;
        if (active && data) {
          const sourceIndex = Math.floor((i / count) ** 1.45 * (data.length * 0.72));
          normalized = data[sourceIndex] / 255;
          normalized = Math.max(0.06, normalized);
        } else {
          const phase = time / 900 + i * 0.42;
          normalized = 0.1 + (Math.sin(phase) * 0.5 + 0.5) * 0.15;
          if (reduced) normalized = 0.12;
        }
        const barHeight = Math.max(2 * dpr, normalized * height * 0.94);
        const x = i * (barWidth + gap);
        const radius = Math.min(barWidth / 2, 3 * dpr);
        ctx.beginPath();
        ctx.roundRect?.(x, height - barHeight, barWidth, barHeight, radius);
        if (!ctx.roundRect) ctx.rect(x, height - barHeight, barWidth, barHeight);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [analyserRef, bars, compact, isPlaying, settings.accent, settings.reduceMotion, settings.theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('h-full w-full', className)}
    />
  );
}
