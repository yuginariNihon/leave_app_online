"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
  const router = useRouter();
  const [showText, setShowText] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowText(true);
    }, 1000);

    const showLogoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 1300);

    const redirectTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => router.replace("/login"), 300);
    }, 2500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(showLogoTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  const handleClick = () => {
    setFadeOut(true);
    setTimeout(() => router.replace("/login"), 300);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#ececec] overflow-hidden cursor-pointer transition-opacity duration-300"
      style={{ opacity: fadeOut ? 0 : 1 }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div
          className={`w-60 h-60 rounded-full bg-black flex items-center justify-center
          transition-all duration-1000
          ${showText ? "scale-100" : "scale-0"}`}
        >
          <Image
            src="/logo.png"
            alt="Leave Online"
            width={128}
            height={128}
            priority
            className={`w-32 h-32 object-contain transition-all duration-500 ${
              showLogo ? "opacity-100 scale-100" : "opacity-0 scale-0"
            }`}
          />
        </div>

        {/* Text */}
        <div
          className={`transition-all duration-700 delay-300
          ${
            showText
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-20"
          }`}
        >
          <h1 className="text-7xl font-black text-black">
            Leave Online
          </h1>
        </div>
      </div>
    </div>
  );
}
