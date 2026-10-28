"use client";

import { useCallback, useMemo, useState } from "react";

type UsePaginationOptions = {
  /** หน้าปัจจุบัน — เจ้าของ state คือผู้เรียก (เช่น `useFilterWithApply`) */
  page: number;
  setPage: (page: number) => void;
  initialTotalPages?: number;
};

type PaginationResult = { totalPages?: number | null };

/**
 * รวม state ของ "จำนวนหน้าทั้งหมด" + helper สำหรับปุ่มก่อนหน้า/ถัดไป
 *
 * - หลัง fetch เสร็จเรียก `applyResult(json)` (callback เสถียร ใส่เป็น dep ของ effect ได้)
 * - `paginationProps` spread ลง `<Pagination {...paginationProps} />`
 * - `canPrev`/`canNext`/`goPrev`/`goNext` สำหรับแถบแบ่งหน้าแบบ ก่อนหน้า/ถัดไป
 */
export function usePagination({
  page,
  setPage,
  initialTotalPages = 0,
}: UsePaginationOptions) {
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const applyResult = useCallback((result: PaginationResult) => {
    setTotalPages(result.totalPages ?? 0);
  }, []);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goPrev = useCallback(() => {
    setPage(Math.max(1, page - 1));
  }, [page, setPage]);

  const goNext = useCallback(() => {
    setPage(Math.min(Math.max(totalPages, 1), page + 1));
  }, [page, setPage, totalPages]);

  const paginationProps = useMemo(
    () => ({ currentPage: page, totalPages, onPageChange: setPage }),
    [page, totalPages, setPage],
  );

  return {
    page,
    totalPages,
    applyResult,
    canPrev,
    canNext,
    goPrev,
    goNext,
    paginationProps,
  } as const;
}
