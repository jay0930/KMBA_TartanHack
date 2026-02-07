'use client';

import { BookOpen } from 'lucide-react';

interface DiaryViewProps {
  content: string;
  date: string;
}

export default function DiaryView({ content, date }: DiaryViewProps) {
  return (
    <div className="p-6 rounded-xl border bg-white shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <BookOpen size={20} />
        {date}의 일기
      </h2>
      {content ? (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-gray-400">아직 일기가 생성되지 않았습니다.</p>
      )}
    </div>
  );
}
