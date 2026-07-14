export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Period {
  id: string;
  name: string;
  color: string;
  startDate: string;
  endDate: string;
  userId: string;
  presetId?: string;
  noteType?: string;
  noteContent?: string;
  hashtags?: string[];
  createdAt: string;
}

export interface Preset {
  id: string;
  name: string;
  userId: string;
  periods?: Period[];
  createdAt: string;
}
