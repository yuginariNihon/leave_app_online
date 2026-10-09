import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserList } from "@/lib/services/leaveService";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function UserManagementPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");
  const result = await getUserList({
    page: 1,
    limit: PAGE_SIZE,
    excludeSuperAdmin: !isSuperAdmin,
  });

  return (
    <UserManagementClient
      // The API route serialized these as ISO strings — do the same here so the
      // client sees exactly the shape it got from the endpoint before.
      initialUsers={result.users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
      initialTotal={result.total}
      initialTotalPages={Math.ceil(result.total / PAGE_SIZE) || 1}
    />
  );
}
