'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationBar({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input when current page changes externally (not during editing)
  useEffect(() => {
    if (!editing) setInputValue(String(currentPage));
  }, [currentPage, editing]);

  // Auto-focus/select input when entering edit mode
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitPage = () => {
    const p = parseInt(inputValue, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    }
    setEditing(false);
  };

  // Compute the 3-page sliding window
  const pages = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map(page => {
          const isActive = page === currentPage;
          return (
            <div key={page} className="relative">
              {isActive && editing ? (
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputValue}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setInputValue(cleaned);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); commitPage(); }
                    if (e.key === 'Escape') { setEditing(false); setInputValue(String(currentPage)); }
                  }}
                  onBlur={commitPage}
                  className="w-12 h-8 text-sm text-center rounded-lg bg-[#0B3C6D] text-white border border-[#1a5a9e] outline-none"
                  aria-label="Enter page number"
                />
              ) : (
                <button
                  onClick={() => {
                    if (isActive) {
                      setEditing(true);
                      setInputValue(String(currentPage));
                    } else {
                      onPageChange(page);
                    }
                  }}
                  className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0B3C6D] text-white cursor-text'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={isActive ? 'Click to type a page number' : `Go to page ${page}`}
                >
                  {page}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
