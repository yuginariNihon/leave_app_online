-- CreateTable
CREATE TABLE "PageResource" (
    "page_resource_id" UUID NOT NULL,
    "page_key" VARCHAR(100) NOT NULL,
    "page_name" VARCHAR(200) NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageResource_pkey" PRIMARY KEY ("page_resource_id")
);

-- CreateTable
CREATE TABLE "PageRolePermission" (
    "page_role_permission_id" UUID NOT NULL,
    "page_resource_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "PageRolePermission_pkey" PRIMARY KEY ("page_role_permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageResource_page_key_key" ON "PageResource"("page_key");

-- CreateIndex
CREATE INDEX "PageRolePermission_role_id_idx" ON "PageRolePermission"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "PageRolePermission_page_resource_id_role_id_key" ON "PageRolePermission"("page_resource_id", "role_id");

-- AddForeignKey
ALTER TABLE "PageRolePermission" ADD CONSTRAINT "PageRolePermission_page_resource_id_fkey" FOREIGN KEY ("page_resource_id") REFERENCES "PageResource"("page_resource_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageRolePermission" ADD CONSTRAINT "PageRolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;
