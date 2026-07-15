"use client";

import { useState, useCallback } from "react";

export function useFilterWithApply<T extends Record<string, string>>(initial: T) {
  const [live, setLive] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [page, setPage] = useState(1);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setLive((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submit = useCallback(() => {
    setApplied(live);
    setPage(1);
  }, [live]);

  const reset = useCallback(
    (defaults?: T) => {
      const d = defaults ?? initial;
      setLive(d);
      setApplied(d);
      setPage(1);
    },
    [initial],
  );

  return { live, setFilter, applied, page, setPage, submit, reset } as const;
}
