"use client";

import { useState } from "react";
import { Priority } from "@/types/todo";

interface AddTodoProps {
  onAdd: (title: string, description?: string, dueDate?: string, priority?: Priority, tags?: string[]) => Promise<void>;
}

export default function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setLoading(true);
    try {
      await onAdd(trimmedTitle, description.trim() || undefined, dueDate || undefined, priority || undefined, tags.length > 0 ? tags : undefined);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("");
      setTags([]);
      setTagInput("");
      setShowDetails(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className={`px-3 py-3 border rounded-lg transition-colors ${
            showDetails
              ? "border-blue-500 text-blue-500 bg-blue-50"
              : "border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
          }`}
          title={showDetails ? "Hide details" : "Add details"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
      {showDetails && (
        <div className="space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            disabled={loading}
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(priority === p ? "" : p)}
                  disabled={loading}
                  className={`px-3 py-3 text-sm transition-colors ${
                    priority === p
                      ? p === 'high' ? 'bg-red-500 text-white'
                      : p === 'medium' ? 'bg-yellow-500 text-white'
                      : 'bg-green-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  const newTag = tagInput.trim();
                  if (!tags.includes(newTag)) {
                    setTags([...tags, newTag]);
                  }
                  setTagInput("");
                }
              }}
              placeholder="添加标签，按 Enter 确认"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              disabled={loading}
            />
          </div>
        </div>
      )}
    </form>
  );
}
