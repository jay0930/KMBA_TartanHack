export interface TimelineEvent {
  id?: string;
  diary_id?: string;
  time: string;        // "08:30" HH:MM
  emoji: string;       // "☕"
  title: string;       // "Morning coffee"
  description: string; // "Got a latte at Blue Bottle"
  spending: number;    // cents (450 = $4.50), 0 if none
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
