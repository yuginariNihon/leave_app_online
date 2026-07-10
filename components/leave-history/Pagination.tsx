import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-8 flex justify-end items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 p-0 text-slate-400 hover:text-[#1a1a40] disabled:opacity-30"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant="ghost"
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 p-0 font-bold rounded-none transition-all ${
            currentPage === page
              ? "border-b-2 border-[#1a1a40] text-[#1a1a40]"
              : "text-slate-400 hover:text-[#1a1a40]"
          }`}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 p-0 text-slate-400 hover:text-[#1a1a40] disabled:opacity-30"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
