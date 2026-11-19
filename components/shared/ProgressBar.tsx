"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type ProgressCtx = { start: () => void; finish: () => void };
const Ctx = createContext<ProgressCtx>({ start: () => {}, finish: () => {} });

export function useProgress() {
  return useContext(Ctx);
}

export function useProgressRouter() {
  const router = useRouter();
  const { start } = useProgress();
  return useMemo(
    () => ({
      ...router,
      push: (href: string) => {
        start();
        router.push(href);
      },
      replace: (href: string) => {
        start();
        router.replace(href);
      },
    }),
    [router, start],
  );
}

function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const inc = useRef<number | null>(null);
  const hide = useRef<number | null>(null);
  const showTimer = useRef<number | null>(null);
  const prev = useRef(pathname);

  const start = useCallback(() => {
    if (hide.current) window.clearTimeout(hide.current);
    if (inc.current) window.clearInterval(inc.current);
    if (showTimer.current) window.clearTimeout(showTimer.current);
    setProgress(15);
    inc.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.1));
    }, 200);
    showTimer.current = window.setTimeout(() => setVisible(true), 200);
  }, []);

  const finish = useCallback(() => {
    if (inc.current) window.clearInterval(inc.current);
    if (showTimer.current) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    setProgress(100);
    hide.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  }, []);

  useEffect(() => {
    const onStart = () => start();
    const onFinish = () => finish();
    window.addEventListener("app:progress-start", onStart);
    window.addEventListener("app:progress-finish", onFinish);
    return () => {
      window.removeEventListener("app:progress-start", onStart);
      window.removeEventListener("app:progress-finish", onFinish);
    };
  }, [start, finish]);

  useEffect(() => {
    if (prev.current !== pathname) {
      prev.current = pathname;
      finish();
    }
  }, [pathname, finish]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-[#0051d5] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const start = useCallback(() => {
    window.dispatchEvent(new Event("app:progress-start"));
  }, []);

  const finish = useCallback(() => {
    window.dispatchEvent(new Event("app:progress-finish"));
  }, []);

  const value = useMemo(() => ({ start, finish }), [start, finish]);

  return (
    <Ctx.Provider value={value}>
      <TopProgressBar />
      {children}
    </Ctx.Provider>
  );
}