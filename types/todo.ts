export type Priority = 'low' | 'medium' | 'high';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
  attachments?: Attachment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
