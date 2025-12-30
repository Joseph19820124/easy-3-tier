import { Todo, ApiResponse, Priority, Attachment } from "@/types/todo";

const API_URL = process.env.NEXT_PUBLIC_GAS_URL || "";

export async function fetchTodos(userId?: string): Promise<Todo[]> {
  const url = userId ? `${API_URL}?userId=${encodeURIComponent(userId)}` : API_URL;
  const response = await fetch(url);
  const result: ApiResponse<Todo[]> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch todos");
  }

  return result.data || [];
}

export async function addTodo(title: string, description?: string, dueDate?: string, priority?: Priority, tags?: string[], userId?: string): Promise<Todo> {
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
      userId,
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

export async function fetchDeletedTodos(userId?: string): Promise<Todo[]> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "getDeleted",
      userId,
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

export async function emptyTrash(userId?: string): Promise<{ deletedCount: number }> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "emptyTrash",
      userId,
    }),
  });

  const result: ApiResponse<{ deletedCount: number }> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to empty trash");
  }

  return result.data!;
}

export async function uploadAttachment(
  todoId: string,
  file: { name: string; mimeType: string; data: string }
): Promise<Attachment> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "uploadAttachment",
      todoId,
      fileName: file.name,
      mimeType: file.mimeType,
      fileData: file.data,
    }),
  });

  const result: ApiResponse<Attachment> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to upload attachment");
  }

  return result.data!;
}

export async function deleteAttachment(
  todoId: string,
  attachmentId: string
): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "deleteAttachment",
      todoId,
      attachmentId,
    }),
  });

  const result: ApiResponse<{ success: boolean; deletedId: string }> = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to delete attachment");
  }
}
