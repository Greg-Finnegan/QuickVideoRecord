import React from "react";

interface AudioVisualizerProps {
  /** Normalized bar magnitudes (each value 0..1). */
  levels: number[];
  /** When false the bars idle flat; used to convey "no audio being captured". */
  isActive?: boolean;
  /** Number of bars to render when no data is available yet. */
  barCount?: number;
  className?: string;
}

/**
 * Presentational audio level visualizer.
 *
 * It is intentionally "dumb" — it just renders a row of bars from `levels`.
 * The data can come from a local AnalyserNode (see useStreamAudioLevels) or
 * from cross-context messages (e.g. the side panel receiving levels broadcast
 * by the recorder tab).
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  levels,
  isActive = true,
  barCount = 28,
  className = "",
}) => {
  const bars = levels.length > 0 ? levels : new Array(barCount).fill(0);

  return (
    <div
      className={`flex items-center justify-center gap-0.5 h-10 ${className}`}
      role="img"
      aria-label={isActive ? "Audio input level" : "Audio inactive"}
    >
      {bars.map((level, i) => {
        // Clamp and give every bar a small floor so it stays visible.
        const magnitude = Math.max(0, Math.min(1, level));
        const heightPct = isActive ? 6 + magnitude * 94 : 6;
        return (
          <span
            key={i}
            className={`w-1 rounded-full flex-shrink-0 transition-[height,background-color] duration-100 ease-out ${
              isActive
                ? "bg-gradient-to-t from-blue-500 to-emerald-400 dark:from-blue-400 dark:to-emerald-300"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
};

export default AudioVisualizer;
