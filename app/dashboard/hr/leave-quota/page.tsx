"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LeaveQuotaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hr/staff-list");
  }, [router]);

  return null;
}
