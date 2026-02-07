'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CalendarEvent, PhotoEvent, TimelineEvent } from '@/lib/types';

// ─── MOCK DATA ───
const MOCK_CALENDAR = [
  { time: '08:30', title: 'Morning Coffee', location: 'Blue Bottle Coffee', emoji: '☕' },
  { time: '10:00', title: 'Team Standup', location: 'Zoom', emoji: '💻' },
  { time: '12:30', title: 'Lunch with Sarah', location: 'Noodle Bar', emoji: '🍜' },
  { time: '15:00', title: 'Gym Session', location: 'CMU Gym', emoji: '🏋️' },
  { time: '19:00', title: 'Dinner', location: 'Thai Place', emoji: '🍛' },
];

const MOCK_PHOTO_EVENTS = [
  { time: '09:15', title: 'Latte art photo', emoji: '📸', source: 'photo' as const },
  { time: '13:00', title: 'Food photo at lunch', emoji: '📸', source: 'photo' as const },
  { time: '17:30', title: 'Sunset walk', emoji: '🌅', source: 'photo' as const },
];

const MOCK_DIARY = `Today was one of those days where the little moments mattered most. Started with my usual Blue Bottle ritual — there's something about that first sip that sets the tone for everything.

The standup was quick (for once), and then Sarah and I finally caught up over noodles. We hadn't talked properly in weeks, and it felt good to just laugh about nothing important.

Hit the gym in the afternoon, which I almost skipped. Glad I didn't — the endorphins carried me through the rest of the day. That sunset walk was unplanned but turned out to be the highlight.

Ended with Thai food, because why not? A small indulgence to close out a good day.`;

// ─── STEP INDICATOR ───
function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            height: 3, borderRadius: 2,
            background: i <= current ? '#3b82f6' : '#e5e7eb',
            transition: 'background 0.4s ease',
          }} />
          <span style={{ fontSize: 10, color: i <= current ? '#3b82f6' : '#aaa', fontWeight: i === current ? 600 : 400 }}>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── STEP 1: CALENDAR ───
function CalendarStep({ onNext }: { onNext: (events: CalendarEvent[]) => void }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setEvents(MOCK_CALENDAR);
      // All checked by default
      setChecked(new Set(MOCK_CALENDAR.map((_, i) => i)));
      setConnected(true);
      setLoading(false);
    }, 1500);
  };

  const toggleCheck = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleTimeChange = (val: string) => {
    // Strip non-digits
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) {
      setNewTime(digits);
    } else {
      setNewTime(digits.slice(0, 2) + ':' + digits.slice(2));
    }
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !newTime.trim()) return;
    const newEvent: CalendarEvent = {
      time: newTime,
      title: newTitle,
      location: newLocation || '',
      emoji: '📌',
    };
    const newIdx = events.length;
    setEvents(prev => [...prev, newEvent]);
    setChecked(prev => new Set(prev).add(newIdx));
    setNewTitle('');
    setNewLocation('');
    setNewTime('');
  };

  const checkedCount = checked.size;

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        Let&apos;s start with your schedule
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Import your calendar to build today&apos;s timeline
      </div>

      {!connected && loading ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 300, textAlign: 'center',
        }}>
          <video
            src="/images/Scotty_Loading.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 16, borderRadius: 16 }}
          />
          <div style={{ fontSize: 14, color: '#666' }}>Connecting to Google Calendar...</div>
        </div>
      ) : !connected ? (
        <div
          onClick={handleConnect}
          className="hover:border-blue-500"
          style={{
            border: '2px dashed #d1d5db',
            borderRadius: 16,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#fafafa',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>Connect Google Calendar</div>
          <div style={{ fontSize: 13, color: '#999' }}>We&apos;ll pull today&apos;s events</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22c55e' }} />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>
              Calendar connected — {checkedCount}/{events.length} selected
            </span>
          </div>

          {events.map((e, i) => {
            const isChecked = checked.has(i);
            return (
              <div
                key={i}
                onClick={() => toggleCheck(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: isChecked ? '#f8fafc' : '#fafafa',
                  borderRadius: 12, cursor: 'pointer',
                  opacity: isChecked ? 1 : 0.5,
                  transition: 'all 0.2s',
                  animation: `fade-in-up 0.3s ease-out ${i * 0.08}s both`,
                }}
              >
                {/* Round checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                  border: isChecked ? 'none' : '2px solid #d1d5db',
                  background: isChecked ? '#3b82f6' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isChecked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 20 }}>{e.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{e.location}</div>
                </div>
                <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600 }}>{e.time}</div>
              </div>
            );
          })}

          {/* Add new event row */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '12px 14px', background: '#f0f9ff', borderRadius: 12,
            border: '1px dashed #93c5fd', marginTop: 4,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 2 }}>
              + Add an event
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Activity"
                style={{
                  flex: 1, padding: '8px 10px', fontSize: 13,
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  outline: 'none', background: 'white',
                }}
              />
              <input
                value={newTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                placeholder="14:00"
                maxLength={5}
                style={{
                  width: 64, flexShrink: 0, padding: '8px 10px', fontSize: 13,
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  outline: 'none', background: 'white', textAlign: 'center',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Location (optional)"
                onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                style={{
                  flex: 1, padding: '8px 10px', fontSize: 13,
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  outline: 'none', background: 'white',
                }}
              />
              <button
                onClick={handleAddEvent}
                style={{
                  width: 64, flexShrink: 0,
                  padding: '8px 0', background: newTitle.trim() && newTime.trim() ? '#3b82f6' : '#d1d5db',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: newTitle.trim() && newTime.trim() ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {!connected && !loading && (
        <div
          onClick={() => onNext([])}
          style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Skip — I&apos;ll add events manually
        </div>
      )}

      {connected && (
        <button
          onClick={() => onNext(events.filter((_, i) => checked.has(i)))}
          className="hover:bg-blue-600"
          style={{
            width: '100%', marginTop: 20, padding: '14px',
            background: checkedCount > 0 ? '#3b82f6' : '#94a3b8',
            color: 'white', border: 'none',
            borderRadius: 14, fontSize: 15, fontWeight: 600,
            cursor: checkedCount > 0 ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          Next — Add Photos ({checkedCount}) →
        </button>
      )}
    </div>
  );
}

// ─── STEP 2: PHOTOS ───
function PhotoStep({ onNext }: { onNext: (photos: PhotoEvent[]) => void }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleUpload = () => {
    setPhotos(['latte.jpg', 'lunch.jpg', 'sunset.jpg']);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2000);
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        Got any photos from today?
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Photos help AI understand your day better
      </div>

      {photos.length === 0 ? (
        <div
          onClick={handleUpload}
          className="hover:border-purple-500"
          style={{
            border: '2px dashed #d1d5db', borderRadius: 16,
            padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            background: '#fafafa', transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>Upload Photos</div>
          <div style={{ fontSize: 13, color: '#999' }}>AI will extract times & activities</div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {photos.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 80, borderRadius: 12,
                background: ['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#fa709a,#fee140)'][i],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `fade-in-up 0.3s ease-out ${i * 0.1}s both`,
              }}>
                <span style={{ fontSize: 24 }}>{['☕', '🍜', '🌅'][i]}</span>
              </div>
            ))}
          </div>

          {analyzing ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 14, color: '#8b5cf6', fontWeight: 500 }}>
                🔍 AI is analyzing your photos...
              </div>
              <div style={{ marginTop: 8, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#8b5cf6', borderRadius: 2, width: '60%', animation: 'loading-bar 2s ease-in-out infinite' }} />
              </div>
            </div>
          ) : analyzed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#8b5cf6' }} />
                <span style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>3 moments detected from photos</span>
              </div>
              {MOCK_PHOTO_EVENTS.map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 14px', background: '#faf5ff', borderRadius: 10,
                  animation: `fade-in-up 0.3s ease-out ${i * 0.08}s both`,
                }}>
                  <span style={{ fontSize: 16 }}>{e.emoji}</span>
                  <span style={{ fontSize: 13, color: '#555', flex: 1 }}>{e.title}</span>
                  <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>{e.time}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button
          onClick={() => onNext([])}
          style={{
            flex: 1, padding: '14px', background: 'transparent',
            color: '#999', border: '1px solid #e5e7eb', borderRadius: 14,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={() => onNext(MOCK_PHOTO_EVENTS)}
          style={{
            flex: 2, padding: '14px', background: analyzed ? '#3b82f6' : '#94a3b8',
            color: 'white', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600, cursor: analyzed ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          Next — Add Spending →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: 24H TIMELINE + SPENDING ───
function TimelineSpendingStep({
  calendarEvents,
  photoEvents,
  onNext,
}: {
  calendarEvents: CalendarEvent[];
  photoEvents: PhotoEvent[];
  onNext: (events: TimelineEvent[]) => void;
}) {
  const allEvents: TimelineEvent[] = [
    ...calendarEvents.map(e => ({ ...e, source: 'calendar' })),
    ...photoEvents,
  ].sort((a, b) => a.time.localeCompare(b.time));

  const [events, setEvents] = useState<TimelineEvent[]>(allEvents);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const total = events.reduce((s, e) => s + (e.spending || 0), 0);

  const handleSaveSpending = (idx: number) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      const updated = [...events];
      updated[idx] = { ...updated[idx], spending: val };
      setEvents(updated);
    }
    setEditingIdx(null);
    setEditValue('');
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        Your day at a glance
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
        Tap the $ to add what you spent
      </div>

      {/* 24h Timeline */}
      <div style={{ position: 'relative', paddingLeft: 48 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
          display: 'flex', flexDirection: 'column',
        }}>
          {hours.map((h) => {
            const topPct = ((h - 6) / 16) * 100;
            return (
              <div key={h} style={{
                position: 'absolute', top: `${topPct}%`, left: 0, width: '100%',
                display: 'flex', alignItems: 'center', transform: 'translateY(-50%)',
              }}>
                <span style={{ fontSize: 10, color: '#bbb', width: 32, textAlign: 'right' }}>
                  {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
                </span>
                <div style={{ width: 6, height: 1, background: '#ddd', marginLeft: 2 }} />
              </div>
            );
          })}
          <div style={{
            position: 'absolute', left: 40, top: 0, bottom: 0,
            width: 2, background: '#f0f0f0', borderRadius: 1,
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: hours.length * 44, position: 'relative' }}>
          {events.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#ccc', fontSize: 14 }}>
              No events yet. Connect calendar or add manually.
            </div>
          ) : (
            events.map((event, idx) => {
              const hour = parseInt(event.time.split(':')[0]);
              const min = parseInt(event.time.split(':')[1]) || 0;
              const topPx = ((hour - 6 + min / 60) / 16) * (hours.length * 44);

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    top: topPx,
                    left: 4,
                    right: 0,
                    animation: `fade-in-up 0.3s ease-out ${idx * 0.06}s both`,
                  }}
                >
                  <div style={{
                    position: 'absolute', left: -9, top: 14,
                    width: 10, height: 10, borderRadius: 5,
                    background: event.source === 'photo' ? '#8b5cf6' : '#3b82f6',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px ' + (event.source === 'photo' ? '#8b5cf6' : '#3b82f6'),
                  }} />

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', marginLeft: 8,
                    background: 'white', borderRadius: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{event.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{event.time}</div>
                    </div>

                    {editingIdx === idx ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 13, color: '#666' }}>$</span>
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSpending(idx)}
                          onBlur={() => handleSaveSpending(idx)}
                          style={{
                            width: 52, padding: '4px 6px', fontSize: 13,
                            border: '1.5px solid #3b82f6', borderRadius: 8,
                            outline: 'none', textAlign: 'right',
                          }}
                          placeholder="0"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingIdx(idx); setEditValue(event.spending ? String(event.spending) : ''); }}
                        style={{
                          padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, flexShrink: 0,
                          background: event.spending ? '#f0fdf4' : '#f9fafb',
                          color: event.spending ? '#16a34a' : '#ccc',
                          border: event.spending ? '1px solid #bbf7d0' : '1px dashed #ddd',
                          transition: 'all 0.15s',
                        }}
                      >
                        {event.spending ? `$${event.spending.toFixed(2)}` : '+ $'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Total + Generate */}
      <div style={{
        marginTop: events.length * 10 + 120,
        padding: '16px', background: '#f8fafc', borderRadius: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#888' }}>Total today</div>
          <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>
            ${total.toFixed(2)}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>
          {events.filter(e => e.spending).length}/{events.length} items
        </div>
      </div>

      <button
        onClick={() => onNext(events)}
        style={{
          width: '100%', marginTop: 16, padding: '16px',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        ✨ Write My Diary
      </button>
    </div>
  );
}

// ─── STEP 4: DIARY RESULT ───
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

function DiaryResult({ events, onDone }: { events: TimelineEvent[]; onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diary, setDiary] = useState<{
    text: string;
    insight: string;
    tip: string;
    total: number;
    emojis: string[];
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const total = events.reduce((s, e) => s + (e.spending || 0), 0);
      const foodSpend = events.filter(e => ['🍜', '☕', '🍛'].includes(e.emoji)).reduce((s, e) => s + (e.spending || 0), 0);
      const pct = total > 0 ? Math.round((foodSpend / total) * 100) : 0;

      setDiary({
        text: MOCK_DIARY,
        insight: `Food & drinks made up ${pct}% of today's $${total.toFixed(2)} spending.`,
        tip: 'Try bringing a thermos from home tomorrow — same ritual, minus the $4.50.',
        total,
        emojis: events.map(e => e.emoji),
      });
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [events]);

  const handleSave = async () => {
    if (!diary || saving) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        date: today,
        diary: {
          diary_text: diary.text,
          spending_insight: diary.insight,
          tomorrow_suggestion: diary.tip,
          total_spending: Math.round(diary.total),
          diary_preview: diary.text.slice(0, 100),
          primary_emoji: events[0]?.emoji || '📝',
          timeline: events.map(e => ({
            time: e.time,
            emoji: e.emoji,
            title: e.title,
            spending: Math.round((e.spending || 0)),
            source: e.source || 'calendar',
          })),
        },
      };
      await fetch(`${BACKEND_URL}/api/diary/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onDone();
    } catch (err) {
      console.error('Failed to save diary:', err);
      onDone();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'float 2s ease-in-out infinite' }}>📝</div>
        <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>
          Writing your diary...
        </div>
        <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>
          AI is reflecting on your day
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4, background: '#3b82f6',
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px' }}>
      <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        Your diary is ready ✨
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
        Friday, February 6, 2026
      </div>

      {/* Emoji mosaic */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {diary!.emojis.map((e, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: 10,
            background: `hsl(${i * 45}, 80%, 95%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            animation: `fade-in-up 0.3s ease-out ${i * 0.05}s both`,
          }}>{e}</div>
        ))}
      </div>

      {/* Diary text */}
      <div style={{
        padding: 20, background: '#fffdf7', borderRadius: 16,
        border: '1px solid #fef3c7', marginBottom: 16,
        fontSize: 14, lineHeight: 1.8, color: '#444',
        fontFamily: "Georgia, 'Times New Roman', serif",
        whiteSpace: 'pre-line',
      }}>
        {diary!.text}
      </div>

      {/* Spending insight */}
      <div style={{
        padding: '14px 18px', background: '#f0fdf4', borderRadius: 14,
        border: '1px solid #bbf7d0', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{diary!.insight}</div>
        </div>
      </div>

      {/* Tomorrow's tip */}
      <div style={{
        padding: '14px 18px', background: '#eff6ff', borderRadius: 14,
        border: '1px solid #bfdbfe', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, color: '#1e40af' }}>{diary!.tip}</div>
        </div>
      </div>

      {/* Thumb selection */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>
          ⭐ What was your favorite moment?
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {events.map((e, i) => (
            <ThumbChip key={i} event={e} />
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '16px',
          background: saving ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {saving ? 'Saving...' : 'Save Diary ✓'}
      </button>
    </div>
  );
}

function ThumbChip({ event }: { event: TimelineEvent }) {
  const [selected, setSelected] = useState(false);
  return (
    <div
      onClick={() => setSelected(!selected)}
      style={{
        padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
        fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
        background: selected ? '#eff6ff' : '#f9fafb',
        border: selected ? '1.5px solid #3b82f6' : '1px solid #e5e7eb',
        color: selected ? '#2563eb' : '#666',
        fontWeight: selected ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {selected && '⭐ '}{event.emoji} {event.title}
    </div>
  );
}

// ─── MAIN PAGE ───
export default function DayFlowInput() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [photoEvents, setPhotoEvents] = useState<PhotoEvent[]>([]);
  const [finalTimeline, setFinalTimeline] = useState<TimelineEvent[]>([]);

  const steps = ['Calendar', 'Photos', 'Timeline', 'Diary'];

  return (
    <div className="max-w-[393px] mx-auto min-h-dvh" style={{ background: '#fafaf9' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          padding: '16px 20px 8px',
          paddingTop: 'calc(16px + var(--safe-top))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(250,250,249,0.9)', backdropFilter: 'blur(12px)',
        }}
      >
        <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
          <span
            onClick={() => step === 0 ? router.push('/') : setStep(Math.max(0, step - 1))}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ fontSize: 18 }}>←</span> Back
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>
          {step + 1} / {steps.length}
        </div>
      </div>

      <StepBar current={step} steps={steps} />

      {/* Step content */}
      <div style={{ animation: 'fade-in-up 0.4s ease-out', paddingBottom: 'calc(40px + var(--safe-bottom))' }}>
        {step === 0 && (
          <CalendarStep onNext={(events) => {
            setCalendarEvents(events);
            setStep(1);
          }} />
        )}
        {step === 1 && (
          <PhotoStep onNext={(photos) => {
            setPhotoEvents(photos);
            setStep(2);
          }} />
        )}
        {step === 2 && (
          <TimelineSpendingStep
            calendarEvents={calendarEvents}
            photoEvents={photoEvents}
            onNext={(timeline) => {
              setFinalTimeline(timeline);
              setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <DiaryResult
            events={finalTimeline}
            onDone={() => {
              router.push('/');
            }}
          />
        )}
      </div>
    </div>
  );
}
