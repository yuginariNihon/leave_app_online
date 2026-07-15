import { LeaveFilters } from "@/components/leave-history/LeaveFilters";

interface ApprovalFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  typeOptions: Array<{ id: string; label: string }>;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  totalItems: number;
  onReset?: () => void;
  onSearchSubmit?: () => void;
}

export function ApprovalFilters(props: ApprovalFiltersProps) {
  return <LeaveFilters {...props} />;
}
