import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffList } from "@/lib/services/leaveService";
import StaffListClient from "./StaffListClient";

export const dynamic = "force-dynamic";

export default async function StaffListPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");

  const result = await getStaffList(
    { page: 1, limit: 10 },
    isSuperAdmin,
  );

  return (
    <StaffListClient
      initialData={result.data}
      initialTotal={result.total}
      initialTotalPages={result.totalPages}
    />
  );
}