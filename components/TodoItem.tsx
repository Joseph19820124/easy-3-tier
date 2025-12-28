"use client";

import { useState } from "react";
import { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onOpenModal: (todo: Todo) => void;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
}

export default function TodoItem({ todo, onToggle, onOpenModal, onDelete, onTagClick }: TodoItemProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(todo.id, !todo.completed);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(todo.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${
        loading ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-blue-500"
        }`}
      >
        {todo.completed && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      <div
        className="flex-1 cursor-pointer"
        onClick={() => onOpenModal(todo)}
      >
        <div className="flex items-center gap-2">
          <span
            className={`${
              todo.completed ? "line-through text-gray-400" : "text-gray-700"
            }`}
          >
            {todo.title}
          </span>
          {todo.priority && (
            <span className={`px-1.5 py-0.5 text-xs rounded ${
              todo.priority === 'high' ? 'bg-red-100 text-red-600'
              : todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-600'
              : 'bg-green-100 text-green-600'
            }`}>
              {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
            </span>
          )}
        </div>
        {todo.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {todo.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs mt-1">
          <span className="text-gray-400">
            {new Date(todo.createdAt).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {todo.dueDate && (
            <span className={`flex items-center gap-1 ${
              !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString())
                ? "text-red-500"
                : "text-blue-500"
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(todo.dueDate).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
        {todo.tags && todo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {todo.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
