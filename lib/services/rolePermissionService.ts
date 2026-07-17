import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_PERMISSIONS } from "@/lib/menu-config";

export type PagePermissionItem = {
  pageResourceId: string;
  pageKey: string;
  pageName: string;
  groupName: string;
  allowedRoleIds: string[];
  allowedRoleNames: string[];
};

const DEFAULT_PAGES = DEFAULT_PAGE_PERMISSIONS;

export async function seedDefaultPagePermissions() {
  const roles = await prisma.role.findMany({ select: { role_id: true, role_name: true } });
  const roleMap = Object.fromEntries(roles.map((r) => [r.role_name.toUpperCase(), r.role_id]));

  for (const page of DEFAULT_PAGES) {
    const existing = await prisma.pageResource.findUnique({
      where: { page_key: page.pageKey },
      select: { page_resource_id: true, rolePermissions: { select: { role_id: true } } },
    });

    if (existing) {
      // Add missing default role permissions for existing pages
      const existingRoleIds = new Set(existing.rolePermissions.map((rp) => rp.role_id));
      for (const roleName of page.defaultRoleNames) {
        const roleId = roleMap[roleName.toUpperCase()];
        if (roleId && !existingRoleIds.has(roleId)) {
          await prisma.pageRolePermission.create({
            data: {
              page_resource_id: existing.page_resource_id,
              role_id: roleId,
            },
          });
        }
      }
      continue;
    }

    const resource = await prisma.pageResource.create({
      data: {
        page_key: page.pageKey,
        page_name: page.pageName,
        group_name: page.groupName,
      },
    });

    for (const roleName of page.defaultRoleNames) {
      const roleId = roleMap[roleName.toUpperCase()];
      if (roleId) {
        await prisma.pageRolePermission.create({
          data: {
            page_resource_id: resource.page_resource_id,
            role_id: roleId,
          },
        });
      }
    }
  }
}

export async function getPagePermissions(): Promise<PagePermissionItem[]> {
  const resources = await prisma.pageResource.findMany({
    where: { is_active: true },
    include: {
      rolePermissions: {
        include: { role: { select: { role_id: true, role_name: true } } },
      },
    },
    orderBy: [{ group_name: "asc" }, { page_name: "asc" }],
  });

  return resources.map((r) => ({
    pageResourceId: r.page_resource_id,
    pageKey: r.page_key,
    pageName: r.page_name,
    groupName: r.group_name,
    allowedRoleIds: r.rolePermissions.map((rp) => rp.role.role_id),
    allowedRoleNames: r.rolePermissions.map((rp) => rp.role.role_name),
  }));
}

export async function updatePagePermission(
  pageResourceId: string,
  roleIds: string[],
) {
  await prisma.pageRolePermission.deleteMany({
    where: { page_resource_id: pageResourceId },
  });

  if (roleIds.length > 0) {
    await prisma.pageRolePermission.createMany({
      data: roleIds.map((roleId) => ({
        page_resource_id: pageResourceId,
        role_id: roleId,
      })),
    });
  }
}
