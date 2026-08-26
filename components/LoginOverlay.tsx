"use client";

import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Check } from "lucide-react";

export function LoginOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] bg-[#11131b] flex flex-col items-center justify-center gap-6"
        >
          {/* Logo — matches login page */}
          <div className="relative">
            <div className="w-16 h-16 bg-[#282a32] border border-[#e1fdff]/20 flex items-center justify-center inner-shadow-cyan">
              <CalendarDays className="w-10 h-10 text-[#e1fdff]" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#11131b] border-2 border-[#00dbe7] flex items-center justify-center shadow-cyan-glow">
              <Check className="w-4 h-4 text-[#00dbe7]" />
            </div>
          </div>

          {/* Spinner */}
          <div className="w-8 h-8 border-2 border-[#00dbe7]/30 border-t-[#00dbe7] rounded-full animate-spin" />

          {/* Text */}
          <div className="text-center">
            <p className="text-[#e1fdff] text-sm font-bold tracking-widest uppercase">
              กำลังเข้าสู่ระบบ
            </p>
            <p className="text-[#46464c] text-xs mt-1">Verifying credentials…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
