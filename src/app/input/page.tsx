'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CalendarEvent, PhotoEvent, TimelineEvent } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// ─── MOCK DATA ───
const MOCK_CALENDAR = [
  { time: '08:30', title: 'Morning Coffee', location: 'Blue Bottle Coffee', emoji: '☕' },
  { time: '10:00', title: 'Team Standup', location: 'Zoom', emoji: '💻' },
  { time: '12:30', title: 'Lunch with Sarah', location: 'Noodle Bar', emoji: '🍜' },
  { time: '15:00', title: 'Gym Session', location: 'CMU Gym', emoji: '🏋️' },
  { time: '19:00', title: 'Dinner', location: 'Thai Place', emoji: '🍛' },
];

// ─── STEP INDICATOR ───
function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            height: 3, borderRadius: 2,
            background: i <= current ? '#0046FF' : '#e5e7eb',
            transition: 'background 0.4s ease',
          }} />
          <span style={{ fontSize: 10, color: i <= current ? '#0046FF' : '#aaa', fontWeight: i === current ? 600 : 400 }}>
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
          className="hover:border-[#73C8D2]"
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
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#0046FF' }} />
            <span style={{ fontSize: 13, color: '#0046FF', fontWeight: 600 }}>
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
                  background: isChecked ? '#0046FF' : 'white',
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
                <div style={{ fontSize: 13, color: '#0046FF', fontWeight: 600 }}>{e.time}</div>
              </div>
            );
          })}

          {/* Add new event row */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '12px 14px', background: 'rgba(0, 70, 255, 0.05)', borderRadius: 12,
            border: '1px dashed #0046FF', marginTop: 4,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0046FF', marginBottom: 2 }}>
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
                  padding: '8px 0', background: newTitle.trim() && newTime.trim() ? '#0046FF' : '#d1d5db',
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
          className="hover:opacity-90"
          style={{
            width: '100%', marginTop: 20, padding: '14px',
            background: checkedCount > 0 ? '#0046FF' : '#94a3b8',
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ url: string; time: number; file: File }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [captions, setCaptions] = useState<{ emoji: string; caption: string; time: string }[]>([]);
  const [editingCaptionIdx, setEditingCaptionIdx] = useState<number | null>(null);

  const MOCK_CAPTIONS = [
    { emoji: '☕', caption: 'Morning coffee at Blue Bottle' },
    { emoji: '🍜', caption: 'Lunch with Sarah at Noodle Bar' },
    { emoji: '🌅', caption: 'Sunset walk by the river' },
  ];

  const formatFileTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const analyzePhotos = async (items: { url: string; time: number; file: File }[]) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      items.forEach(item => formData.append('files', item.file));
      const res = await fetch(`${BACKEND_URL}/api/photos/analyze`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.events) {
        setCaptions(data.events.map((e: any) => ({
          emoji: e.emoji || '📸',
          caption: e.title || e.description || 'Photo',
          time: e.time || '12:00',
        })));
      }
    } catch (err) {
      console.error('Photo analysis failed:', err);
      setCaptions(items.map((_, i) => ({
        ...MOCK_CAPTIONS[i % MOCK_CAPTIONS.length],
        time: formatFileTime(items[i].time),
      })));
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems = Array.from(files).map(f => ({
      url: URL.createObjectURL(f),
      time: f.lastModified,
      file: f,
    }));
    const updated = [...previews, ...newItems]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
    setPreviews(updated);
    // reset input so same file can be re-selected
    e.target.value = '';
    // analyze with AI
    analyzePhotos(updated);
  };

  const handleRemove = (idx: number) => {
    URL.revokeObjectURL(previews[idx].url);
    const updated = previews.filter((_, i) => i !== idx);
    setPreviews(updated);
    if (updated.length === 0) {
      setAnalyzing(false);
      setAnalyzed(false);
    }
  };

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
        Got any photos from today?
      </div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Photos help AI understand your day better
      </div>

      {previews.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="hover:border-[#73C8D2]"
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
          {analyzing ? (
            <div style={{ textAlign: 'center', padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#0046FF', fontWeight: 500 }}>
                🔍 AI is analyzing your photos...
              </div>
              <div style={{ marginTop: 8, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#0046FF', borderRadius: 2, width: '60%', animation: 'loading-bar 2s ease-in-out infinite' }} />
              </div>
            </div>
          ) : analyzed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#0046FF' }} />
                <span style={{ fontSize: 13, color: '#0046FF', fontWeight: 600 }}>
                  {previews.length} moment{previews.length !== 1 ? 's' : ''} detected from photos
                </span>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: 12, color: '#0046FF', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add more
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {previews.map((photo, i) => {
              const cap = captions[i] || MOCK_CAPTIONS[i % MOCK_CAPTIONS.length];
              return (
                <div key={i} style={{
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  animation: `fade-in-up 0.4s ease-out ${i * 0.12}s both`,
                }}>
                  {/* Photo area — 4:3 aspect ratio with real image */}
                  <div style={{
                    width: '100%', aspectRatio: '4/3', position: 'relative',
                    backgroundImage: `url(${photo.url})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    {/* Remove button */}
                    <div
                      onClick={() => handleRemove(i)}
                      style={{
                        position: 'absolute', top: 10, left: 10,
                        width: 28, height: 28, borderRadius: 14,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white', fontSize: 14, fontWeight: 700,
                      }}
                    >
                      ×
                    </div>
                    {/* Time badge from file metadata */}
                    {analyzed && (
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                        borderRadius: 8, padding: '4px 10px',
                        fontSize: 12, fontWeight: 700, color: '#0046FF',
                      }}>
                        {captions[i]?.time || formatFileTime(photo.time)}
                      </div>
                    )}
                  </div>
                  {/* Caption — tap to edit */}
                  {analyzed && (
                    editingCaptionIdx === i ? (
                      <div style={{
                        padding: '6px 10px', background: 'white',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 14 }}>{cap.emoji}</span>
                        <input
                          autoFocus
                          value={cap.caption}
                          onChange={(e) => {
                            const updated = [...captions];
                            const fallback = MOCK_CAPTIONS[i % MOCK_CAPTIONS.length];
                            if (!updated[i]) updated[i] = { ...fallback, time: formatFileTime(previews[i].time) };
                            updated[i] = { ...updated[i], caption: e.target.value };
                            setCaptions(updated);
                          }}
                          onBlur={() => setEditingCaptionIdx(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingCaptionIdx(null)}
                          style={{
                            flex: 1, border: 'none', outline: 'none',
                            fontSize: 13, fontWeight: 500, color: '#333',
                            padding: '4px 0', borderBottom: '1.5px solid #0046FF',
                            background: 'transparent',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingCaptionIdx(i)}
                        style={{
                          padding: '10px 14px', background: 'white',
                          fontSize: 13, fontWeight: 500, color: '#555',
                          display: 'flex', alignItems: 'center', gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{cap.emoji}</span>
                        <span style={{ flex: 1 }}>{cap.caption}</span>
                        <span style={{ fontSize: 10, color: '#bbb' }}>✏️</span>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
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
          onClick={() => {
            const photoEventsFromPreviews: PhotoEvent[] = previews.map((photo, i) => {
              const cap = captions[i] || MOCK_CAPTIONS[i % MOCK_CAPTIONS.length];
              return {
                time: cap.time || formatFileTime(photo.time),
                title: cap.caption,
                emoji: cap.emoji,
                source: 'photo' as const,
              };
            });
            onNext(photoEventsFromPreviews);
          }}
          disabled={!analyzed}
          style={{
            flex: 2, padding: '14px', background: analyzed ? '#0046FF' : '#94a3b8',
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
            (() => {
              const CARD_H = 52;
              // compute top positions
              const positions = events.map((event) => {
                const hour = parseInt(event.time.split(':')[0]);
                const min = parseInt(event.time.split(':')[1]) || 0;
                return ((hour - 6 + min / 60) / 16) * (hours.length * 44);
              });
              // assign columns for overlapping cards
              const cols: number[] = new Array(events.length).fill(0);
              const totalCols: number[] = new Array(events.length).fill(1);
              // group overlapping events
              const groups: number[][] = [];
              const visited = new Set<number>();
              for (let i = 0; i < events.length; i++) {
                if (visited.has(i)) continue;
                const group = [i];
                visited.add(i);
                for (let j = i + 1; j < events.length; j++) {
                  if (visited.has(j)) continue;
                  if (group.some(g => Math.abs(positions[j] - positions[g]) < CARD_H)) {
                    group.push(j);
                    visited.add(j);
                  }
                }
                groups.push(group);
              }
              for (const group of groups) {
                group.sort((a, b) => positions[a] - positions[b]);
                if (group.length <= 1) continue;
                // max 2 columns — alternate left/right
                for (let c = 0; c < group.length; c++) {
                  cols[group[c]] = c % 2;
                  totalCols[group[c]] = 2;
                }
              }

              return events.map((event, idx) => {
                const topPx = positions[idx];
                const col = cols[idx];
                const total_c = totalCols[idx];
                const widthPct = total_c > 1 ? `${100 / total_c}%` : '100%';
                const leftPct = total_c > 1 ? `${(col / total_c) * 100}%` : '0%';
                const isMulti = total_c > 1;

                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      top: topPx,
                      left: `calc(4px + ${leftPct})`,
                      width: `calc(${widthPct} - 4px)`,
                      animation: `fade-in-up 0.3s ease-out ${idx * 0.06}s both`,
                    }}
                  >
                    {col === 0 && (
                      <div style={{
                        position: 'absolute', left: -9, top: 14,
                        width: 10, height: 10, borderRadius: 5,
                        background: event.source === 'photo' ? '#73C8D2' : '#0046FF',
                        border: '2px solid white',
                        boxShadow: '0 0 0 2px ' + (event.source === 'photo' ? '#73C8D2' : '#0046FF'),
                      }} />
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: isMulti ? 6 : 10,
                      padding: isMulti ? '8px 8px' : '10px 12px',
                      marginLeft: col === 0 ? 8 : 2,
                      marginRight: col === total_c - 1 ? 0 : 2,
                      background: 'white', borderRadius: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}>
                      <span style={{ fontSize: isMulti ? 16 : 20, flexShrink: 0 }}>{event.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: isMulti ? 12 : 13, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: isMulti ? 10 : 11, color: '#999' }}>{event.time}</div>
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
                              width: isMulti ? 44 : 52, padding: '4px 6px', fontSize: 13,
                              border: '1.5px solid #0046FF', borderRadius: 8,
                              outline: 'none', textAlign: 'right',
                            }}
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => { setEditingIdx(idx); setEditValue(event.spending ? String(event.spending) : ''); }}
                          style={{
                            padding: isMulti ? '3px 6px' : '4px 10px', borderRadius: 8, cursor: 'pointer',
                            fontSize: isMulti ? 11 : 13, fontWeight: 600, flexShrink: 0,
                            background: event.spending ? 'rgba(0, 70, 255, 0.05)' : '#f9fafb',
                            color: event.spending ? '#0046FF' : '#ccc',
                            border: event.spending ? '1px solid rgba(0, 70, 255, 0.2)' : '1px dashed #ddd',
                            transition: 'all 0.15s',
                          }}
                        >
                          {event.spending ? `$${event.spending.toFixed(2)}` : '+ $'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()
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
          background: 'linear-gradient(135deg, #0046FF, #73C8D2)',
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
const DIARY_MAX_LENGTH = 1000;

function DiaryResult({ events, onDone }: { events: TimelineEvent[]; onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDiary, setEditingDiary] = useState(false);
  const [diary, setDiary] = useState<{
    text: string;
    insight: string;
    tip: string;
    total: number;
    emojis: string[];
  } | null>(null);

  useEffect(() => {
    const generateDiary = async () => {
      try {
        const res = await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeline: events }),
        });
        const data = await res.json();
        const total = data.total_spending || events.reduce((s, e) => s + (e.spending || 0), 0);
        setDiary({
          text: data.diary_text || '',
          insight: data.spending_insight || '',
          tip: data.tomorrow_suggestion || '',
          total,
          emojis: data.emojis || events.map(e => e.emoji),
        });
      } catch (err) {
        console.error('Diary generation failed:', err);
        const total = events.reduce((s, e) => s + (e.spending || 0), 0);
        setDiary({
          text: 'Failed to generate diary. Please try again.',
          insight: `Total spending: $${total.toFixed(2)}`,
          tip: '',
          total,
          emojis: events.map(e => e.emoji),
        });
      } finally {
        setLoading(false);
      }
    };
    generateDiary();
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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 300, textAlign: 'center', padding: '60px 20px',
      }}>
        <video
          src="/images/Scotty_Loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: 140, height: 140, objectFit: 'contain', marginBottom: 16, borderRadius: 16 }}
        />
        <div className="font-[family-name:var(--font-outfit)]" style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>
          Writing your diary...
        </div>
        <div style={{ fontSize: 13, color: '#999' }}>
          AI is reflecting on your day
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

      {/* Diary text — tap to edit */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        {editingDiary ? (
          <div style={{ position: 'relative' }}>
            <textarea
              autoFocus
              value={diary!.text}
              onChange={(e) => {
                if (e.target.value.length <= DIARY_MAX_LENGTH) {
                  setDiary(prev => prev ? { ...prev, text: e.target.value } : prev);
                }
              }}
              onBlur={() => setEditingDiary(false)}
              style={{
                width: '100%', minHeight: 200, padding: 20,
                background: '#fffdf7', borderRadius: 16,
                border: '1.5px solid #0046FF',
                fontSize: 14, lineHeight: 1.8, color: '#444',
                fontFamily: "Georgia, 'Times New Roman', serif",
                resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{
              textAlign: 'right', fontSize: 11, padding: '4px 8px',
              color: diary!.text.length > DIARY_MAX_LENGTH * 0.9 ? '#FF9013' : '#bbb',
            }}>
              {diary!.text.length}/{DIARY_MAX_LENGTH}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingDiary(true)}
            style={{
              padding: 20, background: '#fffdf7', borderRadius: 16,
              border: '1px solid #fef3c7',
              fontSize: 14, lineHeight: 1.8, color: '#444',
              fontFamily: "Georgia, 'Times New Roman', serif",
              whiteSpace: 'pre-line', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {diary!.text}
            <div style={{
              marginTop: 10, fontSize: 11, color: '#bbb',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>✏️</span> Tap to edit
            </div>
          </div>
        )}
      </div>

      {/* Spending insight */}
      <div style={{
        padding: '14px 18px', background: '#FFF3E0', borderRadius: 14,
        border: '1px solid #FFE0B2', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>💰</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FF9013' }}>{diary!.insight}</div>
        </div>
      </div>

      {/* Tomorrow's tip */}
      <div style={{
        padding: '14px 18px', background: '#F5F1DC', borderRadius: 14,
        border: '1px solid #73C8D2', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, color: '#0046FF' }}>{diary!.tip}</div>
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
          background: saving ? '#94a3b8' : 'linear-gradient(135deg, #0046FF, #73C8D2)',
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
        background: selected ? '#F5F1DC' : '#f9fafb',
        border: selected ? '1.5px solid #0046FF' : '1px solid #e5e7eb',
        color: selected ? '#0046FF' : '#666',
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
    <div className="max-w-[393px] mx-auto min-h-dvh" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          padding: '16px 20px 8px',
          paddingTop: 'calc(16px + var(--safe-top))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
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
