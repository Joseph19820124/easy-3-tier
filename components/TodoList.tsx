"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Todo, Priority } from "@/types/todo";
import { fetchTodos, addTodo, updateTodo, deleteTodo, fetchDeletedTodos, restoreTodo, emptyTrash } from "@/lib/api";
import TodoItem from "./TodoItem";
import TodoModal from "./TodoModal";
import AddTodo from "./AddTodo";

export default function TodoList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'dueDate' | 'priority'>('newest');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [deletedTodos, setDeletedTodos] = useState<Todo[]>([]);

  const userId = session?.user?.id;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    loadTodos();
  }, [session, status, router]);

  const loadTodos = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      console.log("Loading todos for userId:", userId);
      const data = await fetchTodos(userId);
      console.log("Loaded todos:", data);
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (title: string, description?: string, dueDate?: string, priority?: Priority, tags?: string[]) => {
    if (!userId) return;
    try {
      const newTodo = await addTodo(title, description, dueDate, priority, tags, userId);
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

  const handleSaveEdit = async (id: string, updates: { title?: string; description?: string; dueDate?: string; priority?: Priority; tags?: string[] }) => {
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

  const loadDeletedTodos = async () => {
    if (!userId) return;
    try {
      const data = await fetchDeletedTodos(userId);
      setDeletedTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deleted todos");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const restored = await restoreTodo(id);
      setDeletedTodos((prev) => prev.filter((todo) => todo.id !== id));
      setTodos((prev) => [...prev, restored]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore todo");
    }
  };

  const toggleTrash = async () => {
    if (!showTrash) {
      await loadDeletedTodos();
    }
    setShowTrash(!showTrash);
  };

  const handleEmptyTrash = async () => {
    if (deletedTodos.length === 0) return;

    const confirmed = window.confirm(`确定要永久删除 ${deletedTodos.length} 个任务吗？此操作不可恢复！`);
    if (!confirmed) return;

    try {
      await emptyTrash(userId);
      setDeletedTodos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to empty trash");
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter((t) => t.completed);
    if (completedTodos.length === 0) return;

    const confirmed = window.confirm(`确定要删除 ${completedTodos.length} 个已完成的任务吗？`);
    if (!confirmed) return;

    try {
      await Promise.all(completedTodos.map((t) => deleteTodo(t.id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear completed");
    }
  };

  // Get all unique tags from todos
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    todos.forEach(todo => {
      todo.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [todos]);

  const filteredAndSortedTodos = useMemo(() => {
    let result = todos.filter(todo => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!todo.title.toLowerCase().includes(query) &&
            !todo.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Tag filter
      if (selectedTag && !todo.tags?.includes(selectedTag)) {
        return false;
      }
      // Status filter
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
  }, [todos, filter, sortOrder, searchQuery, selectedTag]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
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
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {allTags.length > 0 && (
            <select
              value={selectedTag || ""}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">全部标签</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedTag && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">筛选标签:</span>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
              {selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="text-purple-500 hover:text-purple-700"
              >
                ×
              </button>
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{todos.length} tasks total</span>
          <div className="flex items-center gap-3">
            <span>{completedCount} completed</span>
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-red-500 hover:text-red-700 hover:underline transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={toggleTrash}
              className={`flex items-center gap-1 transition-colors ${
                showTrash ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="回收站"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              回收站
            </button>
          </div>
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
              onTagClick={setSelectedTag}
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

      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={toggleTrash}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">回收站</h2>
              <div className="flex items-center gap-2">
                {deletedTodos.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    清空
                  </button>
                )}
                <button onClick={toggleTrash} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {deletedTodos.length === 0 ? (
              <p className="text-center text-gray-400 py-8">回收站是空的</p>
            ) : (
              <div className="space-y-3">
                {deletedTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{todo.title}</p>
                      {todo.description && (
                        <p className="text-sm text-gray-400 truncate">{todo.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRestore(todo.id)}
                      className="ml-3 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      恢复
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
