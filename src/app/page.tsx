'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmojiTimeline from '@/components/EmojiTimeline';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const GRADIENTS = [
  'linear-gradient(135deg, #0046FF 0%, #73C8D2 100%)',
  'linear-gradient(135deg, #FF9013 0%, #F5F1DC 100%)',
  'linear-gradient(135deg, #73C8D2 0%, #0046FF 100%)',
  'linear-gradient(135deg, #F5F1DC 0%, #73C8D2 100%)',
  'linear-gradient(135deg, #0046FF 0%, #FF9013 100%)',
  'linear-gradient(135deg, #73C8D2 0%, #FF9013 100%)',
];

const MOCK_DIARIES = [
  {
    id: '1',
    date: 'Thursday, Feb 5',
    emojis: ['☕', '🍜', '📚', '🍺'],
    times: ['8am', '12pm', '3pm', '7pm'],
    preview: 'A cozy day of coffee and catching up with old friends at the noodle place...',
    total: 47.5,
    hasPhoto: true,
    photoUrl: '/images/grid-1.png',
    photoGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primaryEmoji: '☕',
  },
  {
    id: '2',
    date: 'Wednesday, Feb 4',
    emojis: ['🏃', '☕', '💻', '🍕', '🎬'],
    times: ['7am', '9am', '10am', '1pm', '7pm'],
    preview: 'Started with a run along the river, then powered through a long coding session...',
    total: 32.0,
    hasPhoto: true,
    photoUrl: '/images/209895_00_2x.jpg',
    photoGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    primaryEmoji: '🏃',
  },
  {
    id: '3',
    date: 'Tuesday, Feb 3',
    emojis: ['🧘', '🥗', '🎨', '🍷'],
    times: ['7am', '12pm', '4pm', '8pm'],
    preview: 'Morning yoga cleared my mind, then spent the afternoon painting at the studio...',
    total: 28.0,
    hasPhoto: true,
    photoUrl: '/images/grid-2.png',
    photoGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    primaryEmoji: '🧘',
  },
  {
    id: '4',
    date: 'Monday, Feb 2',
    emojis: ['☕', '💼', '🍔', '🎮', '🛁'],
    times: ['8am', '9am', '1pm', '6pm', '10pm'],
    preview: 'Back to the grind — meetings all morning, grabbed burgers with the team after...',
    total: 53.25,
    hasPhoto: true,
    photoUrl: '/images/grid-4.png',
    photoGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    primaryEmoji: '💼',
  },
  {
    id: '5',
    date: 'Sunday, Feb 1',
    emojis: ['🥞', '📖', '🚶', '🍣'],
    times: ['10am', '1pm', '4pm', '7pm'],
    preview: 'Lazy brunch with pancakes, read half a novel, then evening sushi date downtown...',
    total: 61.5,
    hasPhoto: true,
    photoUrl: '/images/grid-6.png',
    photoGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    primaryEmoji: '📖',
  },
  {
    id: '6',
    date: 'Saturday, Jan 31',
    emojis: ['🏔️', '📸', '☕', '🍲'],
    times: ['9am', '12pm', '3pm', '7pm'],
    preview: 'Hiked up to the overlook and took amazing photos, warmed up with hot pot after...',
    total: 39.0,
    hasPhoto: true,
    photoUrl: '/images/grid-8.png',
    photoGradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
    primaryEmoji: '🏔️',
  },
];

interface MockDiary {
  id: string;
  date: string;
  emojis: string[];
  times: string[];
  preview: string;
  total: number;
  hasPhoto: boolean;
  photoUrl?: string;
  photoGradient: string;
  primaryEmoji: string;
  diaryText?: string;
  spendingInsight?: string;
  tomorrowSuggestion?: string;
}

function TodayCard({ onClick }: { onClick: () => void }) {
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform"
      style={{
        border: '2px dashed rgba(0, 70, 255, 0.3)',
        borderRadius: 20,
        padding: '32px 24px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(0,70,255,0.04) 0%, rgba(115,200,210,0.04) 100%)',
        animation: 'pulse-border 3s ease-in-out infinite',
      }}
    >
      <div className="text-[32px] mb-2">✨</div>
      <div className="text-xl font-semibold text-[#1a1a1a] font-[family-name:var(--font-outfit)] mb-1">
        How was your day today?
      </div>
      <div className="text-[13px] text-gray-400 mb-4">{formatted}</div>
      <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium" style={{ background: '#0046FF', color: 'white' }}>
        Start Writing
      </div>
    </div>
  );
}

function DiaryCard({
  diary,
  onClick,
}: {
  diary: MockDiary;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] p-5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Photo / Emoji Thumbnail */}
      <div
        className="w-full flex items-center justify-center overflow-hidden mb-4 relative"
        style={{
          height: 140,
          borderRadius: 16,
          background: diary.photoGradient,
        }}
      >
        {diary.hasPhoto && diary.photoUrl ? (
          <img
            src={diary.photoUrl}
            alt="diary photo"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : diary.hasPhoto ? (
          <div className="text-sm text-white/80 font-medium">📷 Photo</div>
        ) : (
          <span className="text-[48px]">{diary.primaryEmoji}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <div className="text-[15px] font-semibold text-gray-600 font-[family-name:var(--font-outfit)]">
          {diary.date}
        </div>

        <EmojiTimeline emojis={diary.emojis} />

        <div className="text-[14px] text-gray-500 leading-snug truncate">
          {diary.preview}
        </div>

        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[14px]">💰</span>
          <span className="text-base font-semibold text-gray-700">
            ${diary.total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DayFlowFeed() {
  const router = useRouter();
  const [selectedDiary, setSelectedDiary] = useState<MockDiary | null>(null);
  const [diaries, setDiaries] = useState<MockDiary[]>(MOCK_DIARIES);
  const [weeklyTotal, setWeeklyTotal] = useState(121.75);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/diary/history?limit=30`)
      .then(res => res.json())
      .then((data: Array<{
        id: string;
        date: string;
        diary_text?: string;
        diary_preview?: string;
        total_spending?: number;
        primary_emoji?: string;
        photo_url?: string;
        spending_insight?: string;
        tomorrow_suggestion?: string;
        timeline_events?: Array<{ emoji?: string; time?: string }>;
      }>) => {
        if (data && data.length > 0) {
          const mapped: MockDiary[] = data.map((d, i) => {
            const dateObj = new Date(d.date + 'T12:00:00');
            const formatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            });
            const tlEmojis = d.timeline_events?.map(e => e.emoji || '📝').filter(Boolean) || [];
            const tlTimes = d.timeline_events?.map(e => e.time || '').filter(Boolean) || [];
            return {
              id: d.id,
              date: formatted,
              emojis: tlEmojis.length > 0 ? tlEmojis : [d.primary_emoji || '📝'],
              times: tlTimes,
              preview: d.diary_preview || d.diary_text?.slice(0, 100) || 'No preview available',
              total: d.total_spending || 0,
              hasPhoto: !!d.photo_url,
              photoUrl: d.photo_url,
              photoGradient: GRADIENTS[i % GRADIENTS.length],
              primaryEmoji: d.primary_emoji || '📝',
              diaryText: d.diary_text,
              spendingInsight: d.spending_insight,
              tomorrowSuggestion: d.tomorrow_suggestion,
            };
          });
          setDiaries(mapped);
          const total = mapped.reduce((s, d) => s + d.total, 0);
          setWeeklyTotal(total);
        }
      })
      .catch(() => {
        // Keep mock data on error
      });
  }, []);

  return (
    <>
      <div className="max-w-[393px] mx-auto min-h-dvh relative" style={{ background: '#ffffff' }}>
        {/* Header */}
        <div
          className="px-5 pb-3 flex justify-between items-center sticky top-0 z-10"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            paddingTop: 'calc(12px + var(--safe-top))',
          }}
        >
          <div className="text-2xl font-bold text-[#1a1a1a] font-[family-name:var(--font-outfit)]">
            DayFlow
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer text-base"
            style={{ background: 'rgba(0,0,0,0.05)' }}
          >
            ☀️
          </div>
        </div>

        {/* Feed */}
        <div className="px-4 flex flex-col gap-3.5" style={{ paddingBottom: 'calc(100px + var(--safe-bottom))' }}>
          {/* Today&apos;s empty card */}
          <div style={{ animation: 'fade-in-up 0.5s ease-out' }}>
            <TodayCard onClick={() => router.push('/input')} />
          </div>

          {/* Past diary cards */}
          {diaries.map((diary, i) => (
            <div
              key={diary.id}
              style={{ animation: `fade-in-up 0.5s ease-out ${0.1 * (i + 1)}s both` }}
            >
              <DiaryCard diary={diary} onClick={() => setSelectedDiary(diary)} />
            </div>
          ))}
        </div>

        {/* Weekly Summary Bar */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] pointer-events-none"
          style={{
            padding: '40px 16px 0',
            paddingBottom: 'calc(12px + var(--safe-bottom))',
            background: 'linear-gradient(to top, rgba(255,255,255,1) 60%, rgba(255,255,255,0))',
          }}
        >
          <div className="bg-white rounded-2xl px-5 py-3 flex justify-between items-center shadow-md pointer-events-auto cursor-pointer">
            <div>
              <div className="text-xs text-gray-400">This week</div>
              <div className="text-lg font-bold text-[#1a1a1a] font-[family-name:var(--font-outfit)]">
                ${weeklyTotal.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-0.5">
              {['#0046FF', '#73C8D2', '#FF9013', '#0046FF', '#73C8D2', '#FF9013', '#0046FF'].map(
                (c, i) => (
                  <div
                    key={i}
                    className="rounded opacity-70"
                    style={{
                      width: 8,
                      height: 12 + ((i * 7 + 3) % 24),
                      background: c,
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diary Detail Modal */}
      {selectedDiary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedDiary(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] max-w-[400px] bg-white rounded-3xl p-6 max-h-[80vh] overflow-auto"
            style={{ animation: 'fade-in-up 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-base font-semibold font-[family-name:var(--font-outfit)]">
                {selectedDiary.date}
              </div>
              <div
                onClick={() => setSelectedDiary(null)}
                className="cursor-pointer text-xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </div>
            </div>

            {/* Hero */}
            <div
              className="w-full rounded-2xl flex items-center justify-center mb-4"
              style={{ height: 160, background: selectedDiary.photoGradient }}
            >
              <span className="text-5xl">{selectedDiary.primaryEmoji}</span>
            </div>

            {/* Emoji Timeline */}
            <div className="mb-4">
              <EmojiTimeline emojis={selectedDiary.emojis} times={selectedDiary.times} />
            </div>

            {/* Diary Text */}
            <div className="text-sm leading-relaxed text-gray-600 mb-4 p-4 bg-[#FAFAF8] rounded-xl whitespace-pre-line">
              {selectedDiary.diaryText || `${selectedDiary.preview} It was one of those days where everything just flows naturally. The kind of day you want to remember.`}
            </div>

            {/* Spending */}
            <div className="flex justify-between items-center p-3 px-4 rounded-xl mb-3" style={{ background: 'rgba(255,144,19,0.08)' }}>
              <span className="text-[13px]" style={{ color: '#FF9013' }}>Total Spending</span>
              <span className="text-lg font-bold" style={{ color: '#FF9013' }}>
                ${selectedDiary.total.toFixed(2)}
              </span>
            </div>

            {/* Spending Insight */}
            {selectedDiary.spendingInsight && (
              <div className="p-3 px-4 rounded-xl text-[13px] mb-3" style={{ background: 'rgba(0,70,255,0.06)', color: '#0046FF' }}>
                📊 {selectedDiary.spendingInsight}
              </div>
            )}

            {/* Tomorrow Tip */}
            <div className="p-3 px-4 rounded-xl text-[13px]" style={{ background: 'rgba(115,200,210,0.12)', color: '#0e7490' }}>
              🌱 {selectedDiary.tomorrowSuggestion || "Tomorrow's tip: Try making coffee at home — save $4.50 and enjoy the ritual!"}
            </div>

            {/* Delete */}
            <button
              onClick={async () => {
                if (deleting) return;
                if (!confirm('Are you sure you want to delete this diary?')) return;
                setDeleting(true);
                try {
                  await fetch(`${BACKEND_URL}/api/diary/${selectedDiary.id}`, { method: 'DELETE' });
                  setDiaries(prev => prev.filter(d => d.id !== selectedDiary.id));
                  setWeeklyTotal(prev => prev - selectedDiary.total);
                  setSelectedDiary(null);
                } catch (err) {
                  console.error('Failed to delete diary:', err);
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="w-full mt-6 py-3 rounded-xl text-[13px] font-medium transition-colors"
              style={{
                background: 'transparent',
                color: deleting ? '#ccc' : '#ef4444',
                border: '1px solid',
                borderColor: deleting ? '#e5e7eb' : '#fecaca',
                cursor: deleting ? 'default' : 'pointer',
              }}
            >
              {deleting ? 'Deleting...' : 'Delete this diary'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
