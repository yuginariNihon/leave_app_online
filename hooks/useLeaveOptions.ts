"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type {
  LeaveCaseSelectOption,
  LeaveSelectOption,
} from "@/lib/TypeSchema";

type UseLeaveOptionsResult = {
  leaveTypeOptions: LeaveSelectOption[];
  leaveCaseOptions: LeaveCaseSelectOption[];
  optionsLoading: boolean;
  optionsError: string;
};

export function useLeaveOptions(enabled = true): UseLeaveOptionsResult {
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<LeaveSelectOption[]>([]);
  const [leaveCaseOptions, setLeaveCaseOptions] = useState<LeaveCaseSelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setOptionsLoading(true);
      setOptionsError("");

      try {
        const result = await apiFetch<{
          data?: {
            leaveTypes?: LeaveSelectOption[];
            leaveCases?: LeaveCaseSelectOption[];
          };
        }>("/api/leave-options");

        if (!cancelled) {
          setLeaveTypeOptions(result.data?.leaveTypes ?? []);
          setLeaveCaseOptions(result.data?.leaveCases ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setOptionsError(
            err instanceof Error ? err.message : "Failed to load leave options.",
          );
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { leaveTypeOptions, leaveCaseOptions, optionsLoading, optionsError };
}
