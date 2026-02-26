export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Message {
  id?: number;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  mood?: string;
}

export interface MoodEntry {
  id: number;
  mood: string;
  timestamp: string;
}
