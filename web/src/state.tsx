import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Screen =
  | "welcome"
  | "login"
  | "connect"
  | "setborrow"
  | "home"
  | "heads"
  | "work"
  | "active"
  | "settled"
  | "autocover"
  | "declined"
  | "cashout"
  | "activity"
  | "profile";

export const ONBOARDING: Screen[] = ["welcome", "login", "connect", "setborrow"];

const ALL_SCREENS: Screen[] = [
  "welcome", "login", "connect", "setborrow", "home", "heads", "work",
  "active", "settled", "autocover", "declined", "cashout", "activity", "profile",
];

/** Demo deep-links: /?screen=activity jumps straight to a screen. */
function initialScreen(): Screen {
  const q = new URLSearchParams(window.location.search).get("screen");
  return ALL_SCREENS.includes(q as Screen) ? (q as Screen) : "welcome";
}
/** Screens reachable from the bottom nav, mapped to their tab. */
export const NAV_TABS: { id: Screen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "activity", label: "Activity" },
  { id: "profile", label: "Profile" },
];

export type Plan = "free" | "starter" | "plus" | "pro";
export const PLAN_CAP: Record<Plan, number> = { free: 50, starter: 100, plus: 250, pro: 500 };
export const PLAN_PRICE: Record<Plan, number> = { free: 0, starter: 5, plus: 9, pro: 15 };
export const PLAN_LABEL: Record<Plan, string> = { free: "Free", starter: "Starter", plus: "Plus", pro: "Pro" };

export function planForAmount(v: number): Plan {
  if (v <= 50) return "free";
  if (v <= 100) return "starter";
  if (v <= 250) return "plus";
  return "pro";
}

export interface PushMsg {
  body: string;
  target: Screen;
}

interface QuidState {
  screen: Screen;
  go: (s: Screen) => void;
  inOnboarding: boolean;

  /** Subscription tier (demo default: Plus). */
  plan: Plan;

  auto: boolean;
  toggleAuto: () => void;
  cap: number;
  setCap: (n: number) => void;

  borrow: number;
  setBorrow: (n: number) => void;

  /** Advance amount currently being confirmed / shown. */
  chosen: number;
  setChosen: (n: number) => void;

  sheetOpen: boolean;
  openSheet: (amt?: number) => void;
  closeSheet: () => void;

  score: number;
  setScore: (n: number) => void;

  push: PushMsg | null;
  showPush: (body: string, target: Screen) => void;
  tapPush: () => void;
  dismissPush: () => void;

  install: boolean;
  showInstall: () => void;
  hideInstall: () => void;
}

const Ctx = createContext<QuidState | null>(null);

export function useQuid(): QuidState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useQuid must be used within <QuidProvider>");
  return c;
}

export function QuidProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [auto, setAuto] = useState(true);
  const [cap, setCap] = useState(200);
  const [borrow, setBorrow] = useState(50);
  const [chosen, setChosen] = useState(180);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [score, setScore] = useState(642);
  const [push, setPush] = useState<PushMsg | null>(null);
  const [install, setInstall] = useState(false);

  const value = useMemo<QuidState>(() => {
    const go = (s: Screen) => setScreen(s);
    return {
      screen,
      go,
      inOnboarding: ONBOARDING.includes(screen),
      plan: "plus",
      auto,
      toggleAuto: () => setAuto((a) => !a),
      cap,
      setCap,
      borrow,
      setBorrow,
      chosen,
      setChosen,
      sheetOpen,
      openSheet: (amt?: number) => {
        if (typeof amt === "number") setChosen(amt);
        setSheetOpen(true);
      },
      closeSheet: () => setSheetOpen(false),
      score,
      setScore,
      push,
      showPush: (body: string, target: Screen) => setPush({ body, target }),
      tapPush: () => {
        setPush((p) => {
          if (p) go(p.target);
          return null;
        });
      },
      dismissPush: () => setPush(null),
      install,
      showInstall: () => setInstall(true),
      hideInstall: () => setInstall(false),
    };
  }, [screen, auto, cap, borrow, chosen, sheetOpen, score, push, install]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
