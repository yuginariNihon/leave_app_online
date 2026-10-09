import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleManageList } from "@/lib/services/leaveService";
import { seedDefaultPagePermissions } from "@/lib/services/rolePermissionService";
import ManageRolesClient from "./ManageRolesClient";

export const dynamic = "force-dynamic";

export default async function ManageRolesPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");
  if (!user.roles.includes("SUPER_ADMIN")) redirect("/dashboard");

  // Same seeding the GET route performs, so a fresh install still lists pages.
  const pageResource = await prisma.pageResource.findUnique({
    where: { page_key: "manage_roles_crud" },
    select: { page_resource_id: true },
  });
  if (!pageResource) {
    await seedDefaultPagePermissions();
  }

  const initialData = await getRoleManageList();

  return <ManageRolesClient initialData={initialData} />;
}
