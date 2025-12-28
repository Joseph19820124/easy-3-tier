"use client";

import { useState, useEffect } from "react";
import { Todo } from "@/types/todo";
import { fetchTodos, addTodo, updateTodo, deleteTodo } from "@/lib/api";
import TodoItem from "./TodoItem";
import AddTodo from "./AddTodo";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (title: string) => {
    try {
      const newTodo = await addTodo(title);
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updated = await updateTodo(id, completed);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddTodo onAdd={handleAdd} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{todos.length} tasks total</span>
        <span>{completedCount} completed</span>
      </div>

      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No tasks yet. Add one above!
          </p>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
