'use client';

import { Lightbulb } from 'lucide-react';

interface TomorrowSuggestionProps {
  suggestion: string;
}

export default function TomorrowSuggestion({ suggestion }: TomorrowSuggestionProps) {
  return (
    <div className="p-4 rounded-xl border-2 border-yellow-200 bg-yellow-50">
      <h3 className="font-bold flex items-center gap-2 mb-2">
        <Lightbulb size={18} className="text-yellow-500" />
        내일을 위한 한 줄
      </h3>
      {suggestion ? (
        <p className="text-gray-700">{suggestion}</p>
      ) : (
        <p className="text-gray-400">일기를 작성하면 제안이 생성됩니다.</p>
      )}
    </div>
  );
}
