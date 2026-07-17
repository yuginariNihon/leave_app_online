"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

type ResetPasswordFormProps = {
  name: string;
  staffCode: string;
  departmentName: string | null;
  force?: boolean;
};

export function ResetPasswordForm({ name, staffCode, departmentName, force }: ResetPasswordFormProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <>
    <div className="min-h-screen bg-[#f9f9ff] p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="max-w-6xl mx-auto w-full mb-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "Reset Password" },
            ]}
          />
        </div>
        <div className="flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-xl shadow-lg bg-white border border-[#c7c4d7] relative">
        {/* Sync icon overlap */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center">
          <div className="bg-[#4648d4] p-4 rounded-full shadow-xl border-4 border-white ring-8 ring-[#f9f9ff]">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Left: Employee Info */}
        <div className="bg-[#263143] p-8 flex flex-col justify-center min-h-[500px] text-[#fffbff] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="none">
              <defs>
                <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="white"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)"/>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="inline-block px-4 py-1 bg-[#6063ee] text-white rounded-lg text-sm font-semibold mb-8">
              Employee Box | กล่องพนักงาน
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[#b7c8e1] text-xs uppercase tracking-wider mb-1">Employee ID | รหัสพนักงาน</p>
                <p className="text-xl font-semibold text-[#f9f9ff]">{staffCode}</p>
              </div>
              <div>
                <p className="text-[#b7c8e1] text-xs uppercase tracking-wider mb-1">Name - Lastname | ชื่อ - นามสกุล</p>
                <p className="text-xl font-semibold text-[#f9f9ff]">{name}</p>
              </div>
              <div>
                <p className="text-[#b7c8e1] text-xs uppercase tracking-wider mb-1">Department | แผนก</p>
                <p className="text-xl font-semibold text-[#f9f9ff]">{departmentName ?? "-"}</p>
              </div>
            </div>
            <div className="mt-8 border-t border-[#c7c4d7]/30 pt-6">
              <p className="text-sm text-[#b7c8e1]">Identity verified via VaultSecure Enterprise Authentication.</p>
            </div>
          </div>
        </div>

        {/* Right: Reset Form */}
        <div className="bg-white p-8 flex flex-col justify-center min-h-[500px]">
          <div className="w-full max-w-md mx-auto">
            <div className="inline-block px-4 py-1 bg-[#dee8ff] text-[#4648d4] rounded-lg text-sm font-semibold mb-8">
              Reset Form | แบบฟอร์มเปลี่ยนรหัสผ่าน
            </div>

            <h1 className="text-2xl font-bold text-[#111c2d] mb-4">Update Password</h1>
            <p className="text-sm text-[#464554] mb-8">
              {force
                ? "คุณต้องเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานระบบ กรุณาตั้งรหัสผ่านใหม่ที่ปลอดภัย"
                : "Please choose a secure password that you haven't used before."}
            </p>

            <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#111c2d] flex justify-between">
                  <span>New Password | รหัสผ่านใหม่</span>
                  <span className="text-[#4648d4] text-xs font-medium">* Required</span>
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-white border border-[#c7c4d7] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all pr-12 text-base"
                    id="new_password"
                    placeholder="Enter new password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#4648d4] transition-colors cursor-pointer bg-transparent border-none"
                    onClick={() => setShowNew(!showNew)}
                    tabIndex={-1}
                  >
                    {showNew ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#464554]/70">Password must be at least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#111c2d]">Re-enter New Password | ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 bg-white border border-[#c7c4d7] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all pr-12 text-base"
                    id="confirm_password"
                    placeholder="Confirm new password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#464554] hover:text-[#4648d4] transition-colors cursor-pointer bg-transparent border-none"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4648d4] hover:bg-[#6063ee] text-white py-4 px-6 rounded-lg font-semibold text-sm uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Reset Password | เปลี่ยนรหัสผ่าน
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

            {!force && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="bg-transparent border border-[#c7c4d7] text-[#464554] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#f0f3ff] transition-all cursor-pointer w-full"
                >
                  Cancel | ยกเลิก
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-[#c7c4d7] pt-6 flex items-center gap-2 text-[#505f76]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <p className="text-xs font-medium">Encrypted with 256-bit AES protection</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#111c2d] mb-2">เปลี่ยนรหัสผ่านสำเร็จ</h2>
            <p className="text-[#464554]">กำลังนำคุณไปยังหน้าแดชบอร์ด...</p>
          </div>
        </div>
      )}
    </>
  );
}
