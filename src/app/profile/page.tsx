'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { backendFetch } from '@/lib/api';

interface ProfileData {
  name: string;
  gender: string;
  age: string;
  calendar_url: string;
  photo_url: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    gender: '',
    age: '',
    calendar_url: '',
    photo_url: '',
  });

  // Check auth and load profile data from backend on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      const uid = session.user.id;
      setUserId(uid);

      const fetchProfile = async () => {
        try {
          const res = await backendFetch('/api/user');
          const data = await res.json();
          setProfile({
            name: data.name || '',
            gender: data.gender || '',
            age: data.age?.toString() || '',
            calendar_url: data.calendar_url || '',
            photo_url: data.photo_url || '',
          });

          // Also check localStorage for calendar URL (in case it was set but not saved to DB)
          const calUrl = localStorage.getItem('dayflow_calendar_url');
          if (calUrl && !data.calendar_url) {
            setProfile(prev => ({ ...prev, calendar_url: calUrl }));
          }
        } catch (err) {
          console.error('Failed to load profile:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    });
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: profile.name || null,
        gender: profile.gender || null,
        age: profile.age ? parseInt(profile.age) : null,
        calendar_url: profile.calendar_url || null,
        photo_url: profile.photo_url || null,
      };

      const res = await backendFetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local URL for immediate preview
    const localUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, photo_url: localUrl }));

    // TODO: Upload to Supabase Storage
    // For now, we're just using a local blob URL
    // In production, you'd upload the file to storage and get back a permanent URL
  };

  if (loading) {
    return (
      <div className="max-w-[393px] mx-auto min-h-dvh flex items-center justify-center" style={{ background: '#ffffff' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">👤</div>
          <div className="text-sm text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[393px] mx-auto min-h-dvh" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div
        className="px-5 pb-3 flex items-center sticky top-0 z-10"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          paddingTop: 'calc(12px + var(--safe-top))',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 text-center text-xl font-bold text-[#1a1a1a] font-[family-name:var(--font-outfit)]">
          Profile
        </div>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
          className="text-[#0046FF] text-sm font-semibold px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-8">
          <div
            onClick={() => editing && fileInputRef.current?.click()}
            className={`relative w-24 h-24 rounded-full overflow-hidden ${editing ? 'cursor-pointer' : ''}`}
            style={{
              background: profile.photo_url
                ? `url(${profile.photo_url}) center/cover`
                : 'linear-gradient(135deg, #0046FF 0%, #73C8D2 100%)',
            }}
          >
            {!profile.photo_url && (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                👤
              </div>
            )}
            {editing && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xs font-semibold">
                Change
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {editing && (
            <div className="text-xs text-gray-400 mt-2">Tap to change photo</div>
          )}
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Name
            </label>
            {editing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0046FF] transition-colors"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800">
                {profile.name || 'Not set'}
              </div>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Gender
            </label>
            {editing ? (
              <select
                value={profile.gender}
                onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0046FF] transition-colors"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800">
                {profile.gender || 'Not set'}
              </div>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Age
            </label>
            {editing ? (
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Enter your age"
                min="1"
                max="120"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0046FF] transition-colors"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800">
                {profile.age || 'Not set'}
              </div>
            )}
          </div>

          {/* Google Calendar URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Google Calendar URL
            </label>
            {editing ? (
              <textarea
                value={profile.calendar_url}
                onChange={(e) => setProfile(prev => ({ ...prev, calendar_url: e.target.value }))}
                placeholder="Paste your Google Calendar URL"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0046FF] transition-colors resize-none"
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 break-all">
                {profile.calendar_url || 'Not connected'}
              </div>
            )}
            {profile.calendar_url && !editing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Calendar connected
              </div>
            )}
          </div>
        </div>

        {/* Clear Profile Button */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to clear all profile data?')) {
                try {
                  // Clear profile in DB
                  await backendFetch('/api/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: null,
                      gender: null,
                      age: null,
                      calendar_url: null,
                      photo_url: null,
                    }),
                  });

                  // Clear localStorage
                  localStorage.removeItem('dayflow_calendar_url');

                  // Reset state
                  setProfile({
                    name: '',
                    gender: '',
                    age: '',
                    calendar_url: '',
                    photo_url: '',
                  });
                } catch (err) {
                  console.error('Failed to clear profile:', err);
                  alert('Failed to clear profile data.');
                }
              }
            }}
            className="w-full py-3 text-red-500 text-sm font-semibold hover:bg-red-50 rounded-xl transition-colors"
          >
            Clear Profile Data
          </button>
        </div>
      </div>
    </div>
  );
}
