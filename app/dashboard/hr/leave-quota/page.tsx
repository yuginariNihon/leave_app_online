import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLeaveTypes } from "@/lib/services/leaveService";
import LeaveQuotaClient from "./LeaveQuotaClient";

export const dynamic = "force-dynamic";

export default async function LeaveQuotaPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");
  if (!user.roles.includes("HR") && !user.roles.includes("SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  // The missing-quota list depends on which type HR picks, so only the type
  // dropdown is preloaded; the list still loads on selection.
  const initialLeaveTypes = await getLeaveTypes();

  return <LeaveQuotaClient initialLeaveTypes={initialLeaveTypes} />;
}
