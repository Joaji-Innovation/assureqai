export interface Lead {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  type: 'contact' | 'demo';
  message?: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
