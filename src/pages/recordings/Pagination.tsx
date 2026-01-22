import React from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { useNavigate } from "react-router-dom";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Pagination component for navigating through pages of recordings
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  hasNextPage,
  hasPreviousPage,
}) => {
  const navigate = useNavigate();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handleSettingsButtonClick = () => {
    navigate("/settings");
  };

  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      {/* Total count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {totalItems}
        </span>{" "}
        recordings
      </div>


      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <Button
          variant="ghost"
          rounded="full"
          onClick={onPreviousPage}
          className="px-3 py-2"
          title="Previous page"
        >
          <Icon name="chevron-left" size={16} />
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 text-sm font-medium rounded-full transition-colors ${currentPage === page
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="px-2 text-slate-400 dark:text-slate-500"
            >
              {page}
            </span>
          )
        )}

        {/* Next button */}

        <Button
          variant="ghost"
          rounded="full"
          onClick={onNextPage}
          className="px-3 py-2"
          title="Next page"
        >
          <Icon name="chevron-right" size={16} />
        </Button>
      </div>
      <Button
        variant="ghost"
        rounded="full"
        onClick={handleSettingsButtonClick}
      >
        {"Settings Page"}
      </Button>
    </div>
  );
};

export default Pagination;
