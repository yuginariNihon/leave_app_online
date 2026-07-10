"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { SocialLogin } from "@/components/SocialLogin";
import { CalendarDays, Check } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[#11131b] text-[#e1e1ed] font-space-grotesk selection:bg-[#00f2ff] selection:text-[#006a71]">
      {/* Hero Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#11131b]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ecb2ff]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00dbe7]/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-linear-to-b from-[#191b23]/20 via-transparent to-[#0c0e16]/80"></div>
        <div className="absolute inset-0 cyber-grid opacity-40"></div>
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#11131b]/10 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(0,219,231,0.15)]">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[#e1fdff] text-2xl fill-1">
            <CalendarDays />
          </span>
          <span className="text-xl font-bold tracking-tighter text-[#e1fdff] drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">
            Online Leave System
          </span>
        </div>
        <div className="hidden md:flex gap-6">
          <Link
            className="text-sm text-[#e1fdff] font-bold drop-shadow-[0_0_8px_#00dbe7] transition-all duration-300 uppercase tracking-widest"
            href="#"
          >
            Login
          </Link>
          <Link
            className="text-sm text-[#b9cacb] hover:text-[#e1fdff] transition-all duration-300 uppercase tracking-widest"
            href="#"
          >
            Support
          </Link>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 pt-16 overflow-auto mt-6">
        <div className="w-full max-w-120">
          {/* shadcn Card with Glassmorphism */}
          <Card className="glass-panel border-white/10 neon-border-glow rounded-none relative overflow-hidden bg-transparent shadow-none">
              <CardContent className="p-8 flex flex-col gap-6">
                {/* Inner Decorative Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#e1fdff]/5 blur-3xl"></div>
              {/* Brand Identity */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-none bg-[#282a32] border border-[#e1fdff]/20 flex items-center justify-center inner-shadow-cyan">
                    <span className="material-symbols-outlined text-[40px] text-[#e1fdff] fill-1">
                      <CalendarDays className="w-12 h-12"/>
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#11131b] border-2 border-[#00dbe7] flex items-center justify-center shadow-cyan-glow">
                    <span className="material-symbols-outlined text-[18px] text-[#00dbe7] font-bold">
                      <Check />
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#e1fdff] tracking-tight">
                    Online Leave System
                  </h1>
                  <p className="text-sm text-[#b9cacb] mt-1">
                    ระบบลาออนไลน์ • Employee Access Hub
                  </p>
                </div>
              </div>

              {/* Login Form Component */}
              <LoginForm />

              {/* Social Login Component */}
              {/*<SocialLogin />*/}

              <div className="mt-4 text-center">
                <p className="text-xs text-[#46464c]">
                  Need assistance?{" "}
                  <Link className="text-[#e1fdff] hover:underline" href="#">
                    Contact HR Department
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-center px-10 py-4 gap-4 mt-auto bg-[#0c0e16]/30 backdrop-blur-md border-t border-white/5 relative z-10">
        <span className="text-xs font-bold text-[#e1e1ed] uppercase tracking-wider">
          © 2024 NEXUS SYSTEMS. ALL RIGHTS RESERVED.
        </span>
        <div className="flex gap-6 items-center">
          <Link
            className="text-[10px] text-[#b9cacb] hover:text-[#e1fdff] transition-colors uppercase tracking-widest"
            href="#"
          >
            Privacy Policy
          </Link>
          <Link
            className="text-[10px] text-[#b9cacb] hover:text-[#e1fdff] transition-colors uppercase tracking-widest"
            href="#"
          >
            Terms of Service
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#e1fdff]/10 border border-[#e1fdff]/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#00dbe7] shadow-[0_0_5px_#00dbe7]"></div>
            <span className="text-[10px] text-[#e1fdff] font-bold uppercase tracking-wider">System Status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

 
