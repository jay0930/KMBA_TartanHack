export interface TimelineEvent {
  id?: string;
  diary_id?: string;
  time: string;        // "08:30" HH:MM
  emoji: string;       // "☕"
  title: string;       // "Morning coffee"
  description?: string; // "Got a latte at Blue Bottle"
  spending?: number;    // cents (450 = $4.50), 0 if none
  category?: string;   // "food" | "transport" | "shopping" | "entertainment" | "other"
  source?: string;     // "calendar" | "photo" | "manual" | "chat"
  location?: string;
  photo_url?: string;
  is_deleted?: boolean;
}

export interface DiaryOutput {
  diary_text: string;
  spending_insight: string;
  tomorrow_suggestion: string;
  total_spending: number;
}

export interface CalendarEvent {
  time: string;
  title: string;
  location: string;
  emoji: string;
}

export interface PhotoEvent {
  time: string;
  title: string;
  emoji: string;
  source: 'photo';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Diary style settings

export type DiaryStyle = 'summary' | 'friendly' | 'emotional' | 'poetic' | 'humorous';

export interface DiarySettings {
  style: DiaryStyle;
  language: 'en' | 'ko';
  includeSpending: boolean;
  includeSuggestion: boolean;
  customPrompt?: string;
}

export const DIARY_STYLE_LABELS: Record<DiaryStyle, { label: string; description: string; emoji: string }> = {
  summary: { label: 'Simple Summary', description: 'Clean and concise daily recap', emoji: '📋' },
  friendly: { label: 'Friendly Chat', description: 'Like a friend writing about your day', emoji: '😊' },
  emotional: { label: 'Emotional & Reflective', description: 'Deep feelings and personal reflections', emoji: '💭' },
  poetic: { label: 'Poetic & Literary', description: 'Beautiful prose with metaphors', emoji: '✨' },
  humorous: { label: 'Fun & Witty', description: 'Light-hearted with humor', emoji: '😄' },
};
