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
  createdAt: string;
}
