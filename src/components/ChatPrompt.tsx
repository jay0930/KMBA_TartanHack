'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';

interface ChatPromptProps {
  onSend: (message: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function ChatPrompt({ onSend, messages, isLoading }: ChatPromptProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="오늘 하루에 대해 이야기해주세요..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
