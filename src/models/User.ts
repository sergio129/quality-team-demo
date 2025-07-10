import { QAAnalyst } from "./QAAnalyst";

export interface User {
  id: string;
  email: string;
  password?: string; // Optional para no exponer en respuestas
  name: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  analyst?: QAAnalyst;
  analystId?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  analystId?: string;
}
