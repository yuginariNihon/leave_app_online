const { PrismaClient } = require('./lib/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in process.env");
    process.exit(1);
  }

  console.log("Connecting to database using string: " + connectionString.substring(0, 30) + "...");
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Roles list
    const roles = await prisma.role.findMany();
    console.log("\n--- Roles in DB ---");
    console.log(roles);

    // 2. Staff count and some staff info
    const staffCount = await prisma.staffInfo.count();
    console.log(`\nTotal Staff: ${staffCount}`);

    const staffWithRoles = await prisma.staffInfo.findMany({
      include: {
        staffRoles: {
          include: { role: true }
        }
      }
    });
    console.log("\n--- Staff with Roles ---");
    staffWithRoles.forEach(s => {
      const roleNames = s.staffRoles.map(sr => sr.role.role_name).join(', ');
      console.log(`ID: ${s.staff_id} | Code: ${s.staff_code} | Name: ${s.name} | Roles: [${roleNames}] | SupervisorID: ${s.supervisor_id}`);
    });

    // 3. Leave Requests
    const leaveCount = await prisma.dataLeave.count();
    console.log(`\nTotal Leave Requests: ${leaveCount}`);

    const pendingLeaves = await prisma.dataLeave.findMany({
      where: { leave_status: 'pending' },
      include: {
        staff: { select: { name: true } }
      }
    });
    console.log(`\nPending Leave Requests (${pendingLeaves.length}):`);
    pendingLeaves.forEach(l => {
      console.log(`Leave ID: ${l.leave_id} | Staff: ${l.staff?.name} | Status: ${l.leave_status} | CreatedAt: ${l.created_at}`);
    });

    // 4. Leave Approvals
    const approvalCount = await prisma.leaveApproval.count();
    console.log(`\nTotal Leave Approvals: ${approvalCount}`);

    const pendingApprovals = await prisma.leaveApproval.findMany({
      where: { approval_status: 'pending' },
      include: {
        leave: {
          include: {
            staff: { select: { name: true } }
          }
        },
        approver: { select: { name: true } }
      }
    });
    console.log(`\nPending Leave Approvals in DB (${pendingApprovals.length}):`);
    pendingApprovals.forEach(a => {
      console.log(`Approval ID: ${a.approval_id} | Leave ID: ${a.leave_id} | Staff: ${a.leave?.staff?.name} | Approver ID: ${a.approver_id} | Approver Name: ${a.approver?.name} | Status: ${a.approval_status}`);
    });

  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
