import React, { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import classNames from 'classnames';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    emptyMessage?: string;
    // Future-proofing props
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    totalCount?: number; // For server-side pagination
    manualPagination?: boolean; // If true, data is expected to be just the current page
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    pageSizeOptions = [10, 25, 50],
    defaultPageSize = 10,
    emptyMessage = "No data available",
    manualPagination = false,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // Calculate pagination internally if manualPagination is false
    const paginationData = useMemo(() => {
        if (manualPagination) return {
            currentData: data,
            totalPages: 1
        };

        const totalPages = Math.ceil(data.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const currentData = data.slice(startIndex, startIndex + pageSize);

        // Reset to page 1 if current page is invalid after filtering or data change
        // Note: This side-effect in useMemo is generally discouraged, but common for simpler tables. 
        // Better handled in a useEffect, but let's just sanitise the display logic.

        return { currentData, totalPages };
    }, [data, currentPage, pageSize, manualPagination]);

    // Ensure currentPage is valid
    const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, paginationData.totalPages));
    if (safeCurrentPage !== currentPage && paginationData.totalPages > 0) {
        setCurrentPage(safeCurrentPage);
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1); // Reset to first page on size change
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
            {/* Table Container */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className={classNames("p-4 border-b border-slate-700 font-semibold", col.headerClassName)}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {paginationData.currentData.length > 0 ? (
                            paginationData.currentData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-700/30 transition-colors text-slate-300">
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={`${row.id}-${colIndex}`}
                                            className={classNames("p-4 text-sm", col.className)}
                                        >
                                            {col.cell
                                                ? col.cell(row)
                                                : col.accessorKey
                                                    ? String(row[col.accessorKey])
                                                    : null
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="p-10 text-center text-slate-500 italic">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!manualPagination && data.length > 0 && (
                <div className="p-4 border-t border-slate-700 bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Rows per page selector */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded focus:ring-emerald-500 focus:border-emerald-500 block p-1"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span className="hidden sm:inline text-slate-500">
                            | Total: {data.length}
                        </span>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={safeCurrentPage === 1}
                            className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="First Page"
                        >
                            <FaAngleDoubleLeft />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                            className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous Page"
                        >
                            <FaChevronLeft />
                        </button>

                        <div className="flex items-center px-4 text-sm font-medium text-slate-300">
                            Page <span className="text-emerald-400 mx-1">{safeCurrentPage}</span> of {paginationData.totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1))}
                            disabled={safeCurrentPage === paginationData.totalPages}
                            className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next Page"
                        >
                            <FaChevronRight />
                        </button>
                        <button
                            onClick={() => setCurrentPage(paginationData.totalPages)}
                            disabled={safeCurrentPage === paginationData.totalPages}
                            className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Last Page"
                        >
                            <FaAngleDoubleRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
