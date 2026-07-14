import React from "react";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ force?: string }>;
}) {
  const user = await requireSessionUser();
  const { force } = await searchParams;

  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: user.staffId },
    select: {
      name: true,
      staff_code: true,
      department: { select: { department_name: true } },
    },
  });

  if (!staff) {
    return <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-6">Staff not found</div>;
  }

  return (
    <ResetPasswordForm
      name={staff.name}
      staffCode={staff.staff_code}
      departmentName={staff.department?.department_name ?? null}
      force={force === "true"}
    />
  );
}
