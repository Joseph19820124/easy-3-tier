export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
