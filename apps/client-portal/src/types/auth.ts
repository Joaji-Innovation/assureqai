// Shared authentication types

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role:
    | "super_admin"
    | "client_admin"
    | "manager"
    | "qa_analyst"
    | "auditor"
    | "agent";
  projectId?: string; // Project ID for project-based access control
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}
