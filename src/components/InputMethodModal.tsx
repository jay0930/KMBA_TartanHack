'use client';

import { useRouter } from 'next/navigation';

interface InputMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InputMethodModal({ isOpen, onClose }: InputMethodModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px]" />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[393px] bg-white rounded-t-3xl"
        style={{
          padding: '24px 20px 0',
          paddingBottom: 'calc(24px + var(--safe-bottom))',
          animation: 'slide-up 0.3s ease-out',
        }}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-full bg-gray-300 mx-auto mb-5" />

        <div className="text-lg font-semibold text-center mb-5 font-[family-name:var(--font-outfit)] text-[#1a1a1a]">
          How do you want to capture today?
        </div>

        {/* Main option: Chat */}
        <div
          onClick={() => { onClose(); router.push('/chat'); }}
          className="rounded-2xl p-5 mb-3 cursor-pointer transition-transform hover:scale-[1.02]"
          style={{ color: 'white', background: 'linear-gradient(135deg, #0046FF 0%, #73C8D2 100%)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[28px]">💬</span>
            <div>
              <div className="text-base font-semibold">Chat</div>
              <div className="text-[13px] opacity-85">Tell me about your day</div>
            </div>
          </div>
        </div>

        {/* Secondary options */}
        <div className="flex gap-3">
          <div
            onClick={() => { onClose(); router.push('/photos'); }}
            className="flex-1 rounded-2xl p-4 cursor-pointer text-center transition-transform hover:scale-[1.02]"
            style={{ background: '#F5F1DC', border: '1px solid #73C8D2' }}
          >
            <div className="text-2xl mb-1.5">📸</div>
            <div className="text-sm font-semibold" style={{ color: '#0046FF' }}>Photos</div>
            <div className="text-[11px]" style={{ color: '#73C8D2' }}>Upload images</div>
          </div>
          <div
            onClick={() => { onClose(); router.push('/calendar'); }}
            className="flex-1 rounded-2xl p-4 cursor-pointer text-center transition-transform hover:scale-[1.02]"
            style={{ background: '#F5F1DC', border: '1px solid #FF9013' }}
          >
            <div className="text-2xl mb-1.5">📅</div>
            <div className="text-sm font-semibold" style={{ color: '#FF9013' }}>Calendar</div>
            <div className="text-[11px]" style={{ color: '#FF9013', opacity: 0.7 }}>Import events</div>
          </div>
        </div>
      </div>
    </div>
  );
}
