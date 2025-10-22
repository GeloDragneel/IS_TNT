import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    maxVisiblePages?: number; // Max center pages (not including 1 and last)
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, maxVisiblePages = 5 }) => {
    const pages: (number | "ellipsis")[] = [];
    const leftBuffer = 2;
    const rightBuffer = totalPages - 1;

    const half = Math.floor(maxVisiblePages / 2);
    const isNearStart = currentPage <= half + 1;
    const isNearEnd = currentPage >= totalPages - half;

    // Always show the first page
    pages.push(1);

    if (isNearStart) {
        // Show early pages: 1 2 3 4 5 ... totalPages
        for (let i = 2; i <= Math.min(maxVisiblePages, totalPages - 1); i++) {
            pages.push(i);
        }
        if (totalPages > maxVisiblePages + 1) {
            pages.push("ellipsis");
        }
    } else if (isNearEnd) {
        // Show ending pages: 1 ... N-4 N-3 N-2 N-1 N
        if (totalPages > maxVisiblePages + 1) {
            pages.push("ellipsis");
        }
        for (let i = totalPages - maxVisiblePages + 1; i < totalPages; i++) {
            if (i > 1) pages.push(i);
        }
    } else {
        // Show middle range: 1 ... currentPage-1 currentPage currentPage+1 ... totalPages
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
        }
        pages.push("ellipsis");
    }

    // Always show the last page if it's not already in the list
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center space-x-1">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: "#555555" }}
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Buttons */}
            {pages.map((page, idx) =>
                page === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="text-gray-400 px-2 select-none">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                            currentPage === page ? "bg-cyan-600 text-white border-cyan-600" : "text-gray-300 border-gray-500 hover:text-white hover:bg-gray-600 hover:border-gray-400"
                        }`}
                    >
                        {page}
                    </button>
                )
            )}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: "#555555", marginLeft: "5px" }}
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};

export default Pagination;
