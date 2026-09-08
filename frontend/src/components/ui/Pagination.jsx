import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ currentPage = 1, totalPages = 1, totalItems = 0, itemsPerPage = 10, onPageChange }) => {
  if (totalItems === 0 || totalPages <= 1) return null;

  const startIndex = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end - start < 2) {
      start = Math.max(1, end - 2);
    }
    start = Math.max(1, start);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="py-3 px-6 flex items-center justify-between text-xs text-gray-500 bg-white border-t border-gray-100 select-none mt-auto">
      {/* Left side: Showing 1–10 of X */}
      <div>
        Showing <span className="font-normal">{startIndex}–{endIndex}</span> of <span className="font-normal">{totalItems}</span>
      </div>

      {/* Right side: 1 2 3 › » */}
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-colors ${currentPage === p
                ? 'bg-[#0052cc] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-1 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors ml-0.5"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-1 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
