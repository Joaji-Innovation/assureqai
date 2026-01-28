
export interface SubParameter {
  id: string;
  name: string;
  weight: number;
  type: 'Fatal' | 'Non-Fatal' | 'ZTP';
}

export interface Parameter { // This is a group
  id: string;
  name: string;
  subParameters: SubParameter[];
  lastModified?: string; // Optional for compatibility with QAParameter conversions
}

export interface QAParameter { // This is a Campaign
  id: string;
  name: string;
  description: string;
  parameters: Parameter[]; // An array of parameter groups
  isActive: boolean;
  lastModified: string;
  linkedSopId?: string;
}
