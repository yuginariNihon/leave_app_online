"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export function SocialLogin() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="h-[1px] flex-grow bg-white/10"></div>
        <span className="text-[10px] text-[#46464c] font-bold uppercase tracking-[0.2em]">
          OR CONTINUE WITH
        </span>
        <div className="h-[1px] flex-grow bg-white/10"></div>
      </div>
      <Button variant="outline" className="w-full py-7 border-white/10 hover:bg-white/5 bg-transparent text-[#e1e1ed] rounded-none hover:text-white transition-all text-xs font-bold gap-4 cursor-pointer">
        <Image
          className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all"
          src="https://lh3.googleusercontent.com/aida/ADBb0ugVXk0Mjl-y6RlyiaIkKrl7RLcGVGj5T2Lkkgb3g67tCbsPckcRW2Cv-kPPdiqlPMRfDesCe1nPbbIMhyD209aIjiEadyRqn9oB_B_WuNjpk3E6nNBejkP6gE406Bl-hGaO4r6g34AgGvUd6hF2YSOKvIfVSv948kKVcOrN3d_sp8OkLpoblUoZEwnzrjSNwGfEt5ZjnMYL-RKq20RXyO-asR_IQrvWKng678lhdKpS4IWCI-dtiYxPC84g0ef5ZjwjDr7UjGVdOQ"
          alt="Google SSO"
          width={20}
          height={20}
          unoptimized
        />
        Google SSO Authentication
      </Button>
    </div>
  );
}
