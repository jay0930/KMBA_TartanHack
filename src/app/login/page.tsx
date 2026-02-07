'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignup
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('test1234');
    setIsSignup(false);
    setError(null);
  };

  return (
    <div className="max-w-[393px] mx-auto min-h-dvh flex flex-col justify-center" style={{ background: '#ffffff', padding: '0 24px' }}>
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] font-[family-name:var(--font-outfit)]">
          DayFlow
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isSignup ? 'Create your account' : 'Sign in to your diary'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isSignup && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isSignup}
            style={{
              width: '100%', padding: '14px 16px', fontSize: 15,
              border: '1px solid #e5e7eb', borderRadius: 12,
              outline: 'none', background: '#fafafa',
              boxSizing: 'border-box',
            }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%', padding: '14px 16px', fontSize: 15,
            border: '1px solid #e5e7eb', borderRadius: 12,
            outline: 'none', background: '#fafafa',
            boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%', padding: '14px 16px', fontSize: 15,
            border: '1px solid #e5e7eb', borderRadius: 12,
            outline: 'none', background: '#fafafa',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            fontSize: 13, color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#94a3b8' : '#0046FF',
            color: 'white', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            transition: 'background 0.15s',
            marginTop: 4,
          }}
        >
          {loading ? (isSignup ? 'Creating...' : 'Signing in...') : (isSignup ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <div
        onClick={() => { setIsSignup(!isSignup); setError(null); }}
        style={{
          textAlign: 'center', marginTop: 16,
          fontSize: 13, color: '#0046FF', cursor: 'pointer',
        }}
      >
        {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </div>

      {!isSignup && (
        <div style={{
          marginTop: 32, padding: '16px',
          background: '#f8fafc', borderRadius: 12,
          border: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10, textAlign: 'center' }}>
            Test accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['alice', 'bob', 'charlie'].map((n) => (
              <div
                key={n}
                onClick={() => fillTestAccount(`${n}@test.com`)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8,
                  background: 'white', cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  fontSize: 13, color: '#555',
                  transition: 'border-color 0.15s',
                }}
                className="hover:border-[#0046FF]"
              >
                <span style={{ fontWeight: 500 }}>{n}@test.com</span>
                <span style={{ color: '#bbb' }}>test1234</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
