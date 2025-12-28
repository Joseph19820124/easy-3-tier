"use client";

import { useState, useEffect, useMemo } from "react";
import { Todo, Priority } from "@/types/todo";
import { fetchTodos, addTodo, updateTodo, deleteTodo } from "@/lib/api";
import TodoItem from "./TodoItem";
import TodoModal from "./TodoModal";
import AddTodo from "./AddTodo";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'dueDate' | 'priority'>('newest');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleAdd = async (title: string, description?: string, dueDate?: string, priority?: Priority) => {
    try {
      const newTodo = await addTodo(title, description, dueDate, priority);
      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updated = await updateTodo(id, { completed });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const handleOpenModal = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTodo(null);
  };

  const handleSaveEdit = async (id: string, updates: { title?: string; description?: string; dueDate?: string; priority?: Priority }) => {
    try {
      const updated = await updateTodo(id, updates);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit todo");
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

  const filteredAndSortedTodos = useMemo(() => {
    let result = todos.filter(todo => {
      if (filter === 'all') return true;
      if (filter === 'active') return !todo.completed;
      return todo.completed;
    });

    result.sort((a, b) => {
      if (sortOrder === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortOrder === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPrio = a.priority ? priorityOrder[a.priority] : 3;
        const bPrio = b.priority ? priorityOrder[b.priority] : 3;
        return aPrio - bPrio;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [todos, filter, sortOrder]);

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

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{todos.length} tasks total</span>
          <span>{completedCount} completed</span>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? '全部' : f === 'active' ? '待办' : '已完成'}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['newest', 'oldest', 'dueDate', 'priority'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortOrder(s)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  sortOrder === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'newest' ? '最新' : s === 'oldest' ? '最旧' : s === 'dueDate' ? '截止' : '优先级'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {todos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No tasks yet. Add one above!
          </p>
        ) : filteredAndSortedTodos.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No {filter === 'active' ? 'active' : 'completed'} tasks
          </p>
        ) : (
          filteredAndSortedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onOpenModal={handleOpenModal}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {selectedTodo && (
        <TodoModal
          todo={selectedTodo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
