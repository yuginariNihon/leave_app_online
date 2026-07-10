"use client";

import React, { useState, useEffect } from "react";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { User, Save, Loader2, Mail, Phone, Building2, Briefcase, BadgeInfo } from "lucide-react";
import { toast } from "sonner";

type ProfileData = {
  staffId: string;
  staffCode: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  departmentName: string | null;
  positionName: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch profile");
        }
        if (!cancelled) {
          const p = json.data as ProfileData;
          setProfile(p);
          setName(p.name);
          setPhoneNumber(p.phoneNumber ?? "");
          setEmail(p.email ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneNumber: phoneNumber.trim() || null,
          email: email.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to update profile");
      }
      setProfile(json.data as ProfileData);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "My Profile" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">My Profile</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">View and edit your personal information.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-[#47464f]">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Read-only info card */}
            <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-[#c8c5d0] bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold leading-[22px] text-[#070235]">Employee Info</h2>
                  <p className="text-[12px] leading-[16px] text-[#47464f]">Read-only information</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <BadgeInfo className="w-4 h-4 text-[#47464f] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#47464f]">Staff Code</p>
                    <p className="text-[15px] font-medium text-[#070235]">{profile.staffCode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-[#47464f] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#47464f]">Department</p>
                    <p className="text-[15px] font-medium text-[#070235]">{profile.departmentName ?? "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-[#47464f] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#47464f]">Position</p>
                    <p className="text-[15px] font-medium text-[#070235]">{profile.positionName ?? "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable fields card */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-[#c8c5d0] bg-slate-50/50">
                <h2 className="text-[16px] font-semibold leading-[22px] text-[#070235]">Edit Information</h2>
                <p className="text-[12px] leading-[16px] text-[#47464f]">Update your personal details</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold leading-[18px] text-[#47464f] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#47464f]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-[#c8c5d0] text-[14px] text-[#070235] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold leading-[18px] text-[#47464f] mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#47464f]" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-[#c8c5d0] text-[14px] text-[#070235] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold leading-[18px] text-[#47464f] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#47464f]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-[#c8c5d0] text-[14px] text-[#070235] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#c8c5d0]">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 text-white text-[13px] font-semibold leading-[18px] hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DashboardContent>
    </div>
  );
}
