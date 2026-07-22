
import { requireSessionUser } from "@/lib/auth";
import { DashboardIntro } from "@/components/DashboardIntro";
import { LeaveStatsCards } from "@/components/LeaveStatsCards";
import { QuickActions } from "@/components/QuickActions";
import { ProfileCard } from "@/components/ProfileCard";
import { LeaveRights } from "@/components/LeaveRights";
import { RecentLeaveList } from "@/components/RecentLeaveList";
import {
  getStaffProfile,
  getDashboardLeaveStats,
  getLeaveRightsByStaffId,
  getRecentLeavesByStaffId,
} from "@/lib/services/leaveService";
import { redirect } from "next/navigation";
export default async function DashboardPage() {
  const user = await requireSessionUser();

  const profile = await getStaffProfile(user.staffId);
  if (!profile) redirect("/login");

  const [stats, rights, recentLeaves] = await Promise.all([
    getDashboardLeaveStats(user.staffId),
    getLeaveRightsByStaffId(user.staffId),
    getRecentLeavesByStaffId(user.staffId),
  ]);

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col font-sans">
      <main className="flex-grow p-6 max-w-[1400px] mx-auto w-full">
        <DashboardIntro userName={profile.name} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <LeaveStatsCards stats={stats} />
            <RecentLeaveList leaves={recentLeaves} />
          </div>
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <ProfileCard profile={profile} />
            <QuickActions />
            <LeaveRights rights={rights} />
          </aside>
        </div>
      </main>
    </div>
  );
}
