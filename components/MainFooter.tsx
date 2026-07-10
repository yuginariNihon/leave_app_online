"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

export function MainFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/login") || pathname?.startsWith("/dashboard/approval-requests")) return null;
  return (
    <footer className="relative z-20 bg-[#0b1c30] text-white p-8 mt-6">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Leave Online System</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              The Wilderbound internal system for efficient leave management. 
              Streamlined for modern teams and forest lovers alike.
            </p>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="text-sm">036-601-622</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="text-sm text-white/80">testDummy@gmail.com</span>
              </div>
            </div>
            
            {/* Social Icons */}
            <div className="flex gap-4 pt-2">
              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs font-bold">
                  <a href="https://www.facebook.com/p/Recruitment-Nihonichi-Food-Thailand-100090232592627/" target="_blank" rel="noopener noreferrer">f</a>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs font-bold">t</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <span className="text-xs font-bold">in</span>
              </div>
            </div>
          </div>

          {/* Feedback Form Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <div className="space-y-2">
              <input
                className="w-full bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:ring-[#f59e0b] focus:border-[#f59e0b] outline-none transition-all placeholder:text-white/40"
                placeholder="Your email address"
                type="email"
              />
              <textarea
                className="w-full bg-white/10 border border-white/20 text-white rounded p-3 text-sm focus:ring-[#f59e0b] focus:border-[#f59e0b] outline-none transition-all placeholder:text-white/40"
                placeholder="Message..."
                rows={3}
              ></textarea>
              <button className="w-full bg-[#f59e0b] hover:bg-orange-600 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

