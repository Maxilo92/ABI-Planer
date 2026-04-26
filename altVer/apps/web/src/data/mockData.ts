export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export interface Year {
  id: string;
  label: string;
  phase: number;
  status: 'active' | 'read-only';
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  user: string;
}

export interface BudgetGoal {
  id: string;
  label: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
}

export interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'party' | 'meeting' | 'deadline';
  location?: string;
}

export const mockTenants: Tenant[] = [
  {
    id: 'hhg-1',
    name: 'Heinrich-Heine-Gymnasium',
    subdomain: 'hgr',
  },
];

export const mockYears: Year[] = [
  {
    id: '2026',
    label: 'Abi 2026',
    phase: 4,
    status: 'active',
  },
  {
    id: '2025',
    label: 'Abi 2025',
    phase: 7,
    status: 'read-only',
  },
];

export const mockTransactions: Record<string, Transaction[]> = {
  '2026': [
    { id: 't1', type: 'expense', amount: 150.00, category: 'Deko', description: 'Deko Abiball', date: '2025-10-01', user: 'Sarah K.' },
    { id: 't2', type: 'income', amount: 500.00, category: 'Sponsoring', description: 'Sparkasse Spende', date: '2025-09-15', user: 'System' },
    { id: 't3', type: 'expense', amount: 2000.00, category: 'Location', description: 'Anzahlung Stadthalle', date: '2025-08-20', user: 'Felix M.' },
  ],
  '2025': [
    { id: 't4', type: 'expense', amount: 5000.00, category: 'Location', description: 'Restzahlung Stadthalle', date: '2025-06-15', user: 'Admin' },
    { id: 't5', type: 'income', amount: 12000.00, category: 'Tickets', description: 'Ticketverkauf Abiball', date: '2025-05-10', user: 'System' },
  ],
};

export const mockBudgetGoals: Record<string, BudgetGoal[]> = {
  '2026': [
    { id: 'b1', label: 'Abiball Location', targetAmount: 5000, currentAmount: 2000, category: 'Location' },
    { id: 'b2', label: 'Catering', targetAmount: 8000, currentAmount: 1500, category: 'Food' },
  ],
  '2025': [
    { id: 'b3', label: 'Abiball Gesamtkosten', targetAmount: 25000, currentAmount: 25000, category: 'Event' },
  ],
};

export const mockTodos: Record<string, Todo[]> = {
  '2026': [
    { id: 'todo1', title: 'Sponsorenliste finalisieren', status: 'done', priority: 'medium', assignee: 'Marc U.', dueDate: '2025-10-05' },
    { id: 'todo2', title: 'Motto-Voting starten', status: 'todo', priority: 'high', assignee: 'Sarah K.', dueDate: '2025-11-20' },
    { id: 'todo3', title: 'Anzahlung Location leisten', status: 'done', priority: 'high', assignee: 'Felix M.', dueDate: '2025-08-15' },
  ],
  '2025': [
    { id: 'todo4', title: 'Zeugnisausgabe organisieren', status: 'done', priority: 'medium', assignee: 'Lehrer-Team', dueDate: '2025-06-20' },
  ],
};

export const mockEvents: Record<string, Event[]> = {
  '2026': [
    { id: 'e1', title: 'Abiball 2026', date: '2026-06-27', type: 'party', location: 'Stadthalle' },
    { id: 'e2', title: 'Mathe Abi-Prüfung', date: '2026-04-15', type: 'exam' },
    { id: 'e3', title: 'Planungstreffen', date: '2025-10-15', type: 'meeting', location: 'Raum 102' },
  ],
  '2025': [
    { id: 'e4', title: 'Abiball 2025', date: '2025-06-21', type: 'party', location: 'Stadthalle' },
  ],
};
