'use client';

interface EmojiTimelineProps {
  emojis: string[];
  times?: string[];
}

export default function EmojiTimeline({ emojis, times }: EmojiTimelineProps) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      {emojis.map((emoji, i) => (
        <div key={i} className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col items-center">
            <span
              className="flex items-center justify-center text-[14px]"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.04)',
              }}
            >
              {emoji}
            </span>
            {times?.[i] && (
              <span className="text-[9px] text-gray-400 mt-[1px]">
                {times[i]}
              </span>
            )}
          </div>
          {i < emojis.length - 1 && (
            <span
              className="text-[10px] text-gray-300"
              style={{ marginBottom: times ? 12 : 0 }}
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
