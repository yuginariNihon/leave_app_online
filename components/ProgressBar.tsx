"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";

type ProgressCtx = { start: () => void; finish: () => void };
const Ctx = createContext<ProgressCtx>({ start: () => {}, finish: () => {} });

export function useProgress() {
  return useContext(Ctx);
}

export function useProgressRouter() {
  const router = useTransitionRouter();
  const { start } = useProgress();
  return {
    ...router,
    push: (href: string) => {
      start();
      (router as { push: (h: string) => void }).push(href);
    },
    replace: (href: string) => {
      start();
      (router as { replace: (h: string) => void }).replace(href);
    },
  } as typeof router;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
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
    setProgress(8);
    inc.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : Math.min(90, p + (90 - p) * 0.1 + 1)));
    }, 200);
    showTimer.current = window.setTimeout(() => setVisible(true), 250);
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
    }, 300);
  }, []);

  useEffect(() => {
    const onStart = () => start();
    const onFinish = () => finish();
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return;
      try {
        if (new URL(href, location.href).origin !== location.origin) return;
      } catch {
        return;
      }
      start();
    };
    const onPop = () => start();
    window.addEventListener("app:progress-start", onStart);
    window.addEventListener("app:progress-finish", onFinish);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("app:progress-start", onStart);
      window.removeEventListener("app:progress-finish", onFinish);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, [start, finish]);

  useEffect(() => {
    if (prev.current !== pathname) {
      prev.current = pathname;
      finish();
    }
  }, [pathname, finish]);

  return (
    <Ctx.Provider value={{ start, finish }}>
      {children}
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
    </Ctx.Provider>
  );
}
