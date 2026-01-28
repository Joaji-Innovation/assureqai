
export interface SOP {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  lastModified: string; // Store as ISO string for simplicity with localStorage
  status: 'Draft' | 'Published' | 'Archived';
  linkedParameterSetId?: string; // ID of the QA Parameter Set (Campaign) linked to this SOP
}

