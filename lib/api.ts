import { Todo, ApiResponse, Priority } from "@/types/todo";

const API_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(API_URL);
  const result: ApiResponse<Todo[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch todos");
  }

  return result.data || [];
}

export async function addTodo(title: string, description?: string, dueDate?: string, priority?: Priority, tags?: string[]): Promise<Todo> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "add",
      title,
      description,
      dueDate,
      priority,
      tags,
    }),
  });

  const result: ApiResponse<Todo> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to add todo");
  }

  return result.data!;
}

export async function updateTodo(
  id: string,
  updates: { completed?: boolean; title?: string; description?: string; dueDate?: string; priority?: Priority; tags?: string[] }
): Promise<Todo> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "update",
      id,
      ...updates,
    }),
  });

  const result: ApiResponse<Todo> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to update todo");
  }

  return result.data!;
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "delete",
      id,
    }),
  });

  const result: ApiResponse<{ id: string; deleted: boolean }> =
    await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to delete todo");
  }
}

export async function fetchDeletedTodos(): Promise<Todo[]> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "getDeleted",
    }),
  });

  const result: ApiResponse<Todo[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch deleted todos");
  }

  return result.data || [];
}

export async function restoreTodo(id: string): Promise<Todo> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "restore",
      id,
    }),
  });

  const result: ApiResponse<Todo> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to restore todo");
  }

  return result.data!;
}

export async function emptyTrash(): Promise<{ deletedCount: number }> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "emptyTrash",
    }),
  });

  const result: ApiResponse<{ deletedCount: number }> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to empty trash");
  }

  return result.data!;
}
