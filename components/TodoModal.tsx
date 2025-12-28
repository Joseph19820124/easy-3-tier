"use client";

import { useState, useEffect, useRef } from "react";
import { Todo, Priority } from "@/types/todo";

interface TodoModalProps {
  todo: Todo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { title?: string; description?: string; dueDate?: string; priority?: Priority }) => Promise<void>;
}

export default function TodoModal({ todo, isOpen, onClose, onSave }: TodoModalProps) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || "");
  const [dueDate, setDueDate] = useState(todo.dueDate || "");
  const [priority, setPriority] = useState<Priority | "">(todo.priority || "");
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setDueDate(todo.dueDate || "");
      setPriority(todo.priority || "");
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, todo]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const updates: { title?: string; description?: string; dueDate?: string; priority?: Priority } = {};
    if (trimmedTitle !== todo.title) updates.title = trimmedTitle;
    if (description !== (todo.description || "")) updates.description = description;
    if (dueDate !== (todo.dueDate || "")) updates.dueDate = dueDate;
    if (priority !== (todo.priority || "")) updates.priority = priority as Priority;

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onSave(todo.id, updates);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">编辑任务</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入任务标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="添加任务描述（可选）"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(priority === p ? "" : p)}
                    className={`flex-1 px-3 py-2 text-sm transition-colors ${
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
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
