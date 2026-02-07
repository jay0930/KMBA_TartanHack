export interface TimelineEvent {
  time: string;
  event: string;
  expense: number;
  photoUrl?: string;
}

export interface Diary {
  id?: string;
  date: string;
  content: string;
  tomorrowSuggestion: string;
  timeline: TimelineEvent[];
  totalExpense: number;
  createdAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
