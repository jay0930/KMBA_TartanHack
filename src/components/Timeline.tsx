'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import type { TimelineEvent } from '@/lib/types';

interface TimelineProps {
  events: TimelineEvent[];
  onUpdateExpense: (index: number, expense: number) => void;
}

export default function Timeline({ events, onUpdateExpense }: TimelineProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Clock size={20} />
        Today&apos;s Timeline
      </h2>
      {events.length === 0 ? (
        <p className="text-gray-500">No events yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event, index) => (
            <li key={index} className="flex items-center gap-4 p-3 rounded-lg border">
              <span className="text-sm font-mono text-gray-500">{event.time}</span>
              <span className="flex-1">{event.title}</span>
              <input
                type="number"
                placeholder="Amount"
                value={event.spending || ''}
                onChange={(e) => onUpdateExpense(index, Number(e.target.value))}
                className="w-24 px-2 py-1 border rounded text-right"
              />
              <span className="text-sm text-gray-400">$</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
