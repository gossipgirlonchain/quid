import { useEffect, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useQuid, NAV_TABS } from "../state";
import { Button, Logo, Row } from "./ui";

/** Textured backdrop + the phone frame (full-screen on small viewports). */
export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#D9DADF] p-6 max-[480px]:bg-paper max-[480px]:p-0">
      <div className="relative flex h-[780px] w-[390px] flex-col overflow-hidden rounded-[36px] border-4 border-ink bg-paper shadow-brutal-lg max-[480px]:h-dvh max-[480px]:w-screen max-[480px]:rounded-none max-[480px]:border-0 max-[480px]:shadow-none">
        <div className="absolute left-1/2 top-[10px] z-40 h-[22px] w-[120px] -translate-x-1/2 rounded-b-[14px] bg-ink max-[480px]:hidden" />
        <div className="flex h-11 items-end justify-between px-[22px] pb-1 font-mono text-xs font-bold">
          <span>9:41</span>
          <span>100%</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Scrollable screen container with the enter animation + safe bottom padding. */
export function ScreenShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-[14px] overflow-y-auto px-[18px] pb-[84px] pt-[14px] [scrollbar-width:none] animate-[screen-in_0.26s_ease-out]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppBar() {
  const { go, score } = useQuid();
  return (
    <div className="z-30 flex items-center justify-between border-b-[3px] border-ink bg-paper px-[18px] pb-3 pt-1.5">
      <Logo size={34} />
      <button
        onClick={() => go("profile")}
        className="inline-flex items-center gap-[7px] rounded-full border-[3px] border-ink bg-quid px-[13px] py-[5px] font-mono text-[13px] font-bold shadow-brutal-sm transition-[transform,box-shadow] duration-100 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span className="text-[10px] tracking-[0.06em]">QUID SCORE</span>
        <b className="tabular">{score}</b>
      </button>
    </div>
  );
}

export function BottomNav() {
  const { screen, go } = useQuid();
  return (
    <nav className="absolute inset-x-0 bottom-0 flex h-[72px] border-t-[3px] border-ink bg-paper pb-[env(safe-area-inset-bottom)]">
      {NAV_TABS.map((t) => {
        const on = screen === t.id;
        return (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 pt-3 font-body text-[11px] font-semibold",
              on ? "text-ink" : "text-muted",
            )}
          >
            <span className={cn("h-2 w-2 rounded-[3px] border-2", on ? "border-ink bg-quid" : "border-muted")} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export function PushBanner() {
  const { push, tapPush, dismissPush } = useQuid();
  useEffect(() => {
    if (!push) return;
    const t = setTimeout(dismissPush, 5000);
    return () => clearTimeout(t);
  }, [push, dismissPush]);

  if (!push) return null;
  return (
    <button
      onClick={tapPush}
      className="absolute inset-x-3 top-[48px] z-[60] flex items-start gap-[11px] rounded-2xl border-[3px] border-ink bg-surface p-3 text-left shadow-brutal animate-[push-in_0.3s_ease-out]"
    >
      <Logo size={34} />
      <div className="flex-1">
        <Row className="mb-0.5">
          <span className="text-[13px] font-bold">Quid</span>
          <span className="font-mono text-[10px] text-muted">now</span>
        </Row>
        <p className="text-[13px] leading-[1.35]">{push.body}</p>
      </div>
    </button>
  );
}

export function InstallBanner() {
  const { install, hideInstall } = useQuid();
  if (!install) return null;
  return (
    <div className="absolute inset-x-3 bottom-[84px] z-[55] flex items-center justify-between gap-2.5 rounded-2xl border-[3px] border-ink bg-ink p-3 text-white shadow-brutal">
      <div className="flex items-center gap-2.5">
        <Logo size={30} />
        <div className="text-[13px] font-semibold">Add Quid to your home screen</div>
      </div>
      <div className="flex gap-1.5">
        <Button sm variant="primary" onClick={hideInstall} className="w-auto px-3">
          Install
        </Button>
        <Button sm variant="ghost" onClick={hideInstall} className="w-auto px-2.5 text-white shadow-none">
          ✕
        </Button>
      </div>
    </div>
  );
}
