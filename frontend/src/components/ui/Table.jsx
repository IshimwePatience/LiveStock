import React from 'react';
import clsx from 'clsx';

export const Table = ({ columns, data, isLoading }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-3">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading data...
                </div>
              </td>
            </tr>
          ) : data?.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-green-50/50 transition">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-gray-800">
                    {col.accessor ? row[col.accessor] : col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
