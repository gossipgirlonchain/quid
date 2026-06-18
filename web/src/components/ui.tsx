import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

type Variant = "default" | "primary" | "coral" | "ghost";

/** Brutalist button: 3px border, hard offset shadow, physical push on press. */
export function Button({
  variant = "default",
  sm = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; sm?: boolean }) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-surface font-body font-bold",
        "transition-[transform,box-shadow] duration-100 ease-out active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0",
        sm ? "min-h-10 px-3 py-2.5 text-sm shadow-brutal-sm" : "min-h-12 px-4 py-[14px] text-base shadow-brutal-sm",
        variant === "primary" && "bg-quid",
        variant === "coral" && "bg-coral text-white",
        variant === "ghost" && "border-ink bg-transparent shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  flat = false,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return (
    <div
      className={cn(
        // shrink-0: cards live in flex-column screens; without it, overflow-hidden
        // cards get min-height 0 and squash when the screen scrolls.
        "shrink-0 rounded-2xl border-[3px] border-ink bg-surface p-[18px]",
        flat ? "shadow-none" : "shadow-brutal",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Kicker({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-muted", className)}>
      {children}
    </div>
  );
}

/** The hero number: display font, tabular figures, tight tracking. */
export function Money({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("tabular font-disp text-[42px] font-extrabold leading-none tracking-[-0.03em]", className)}>
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("my-1 h-[2px] bg-ink/15", className)} />;
}

export function Row({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex items-center justify-between gap-2.5", className)}>{children}</div>;
}

export function Tag({ tone, className, children }: { tone?: "g" | "c" | "s"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-2.5 py-1 font-mono text-[11px] font-bold text-ink",
        tone === "g" && "bg-quid",
        tone === "c" && "bg-coral text-white",
        tone === "s" && "bg-sun text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The app logo mark. */
export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return <img src="/quid-logo.png" alt="Quid" width={size} height={size} className={cn("flex-none", className)} />;
}

type Tone = "quid" | "coral" | "sun";

export function Avatar({
  tone = "quid",
  size = 40,
  pulse = false,
  className,
  children = "Q",
}: {
  tone?: Tone;
  size?: number;
  pulse?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative grid flex-none place-items-center rounded-xl border-[3px] border-ink font-disp font-extrabold text-ink",
        tone === "quid" && "bg-quid",
        tone === "coral" && "bg-coral text-white",
        tone === "sun" && "bg-sun text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {children}
      {pulse && (
        <span className="pointer-events-none absolute -inset-[3px] rounded-[14px] border-[3px] border-ink opacity-0 animate-[pulse-ring_1.8s_ease-out_infinite]" />
      )}
    </div>
  );
}

/** A kicker line + the agent's first-person message. */
export function AgentLine({
  kicker,
  light = false,
  children,
}: {
  kicker: ReactNode;
  light?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <Kicker className={light ? "text-white" : "text-ink"}>{kicker}</Kicker>
      <p className={cn("mt-0.5 text-[15px] font-semibold", light && "text-white")}>{children}</p>
    </div>
  );
}

export function Toggle({ on, onToggle, big = false }: { on: boolean; onToggle: () => void; big?: boolean }) {
  const w = big ? 58 : 52;
  const h = big ? 34 : 30;
  const knob = big ? 26 : 22;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "relative flex-none rounded-full border-[3px] border-ink transition-colors duration-150",
        on ? "bg-quid" : "bg-paper",
      )}
      style={{ width: w, height: h }}
    >
      <span
        className="absolute top-[2px] rounded-full border-2 border-ink bg-white transition-[left] duration-150"
        style={{ width: knob, height: knob, left: on ? w - knob - 6 : 2 }}
      />
    </button>
  );
}

export function H1({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h1 className={cn("text-balance font-disp text-[26px] font-bold leading-[1.08] tracking-[-0.02em]", className)}>
      {children}
    </h1>
  );
}

export function H2({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("font-disp text-[18px] font-bold leading-[1.1] tracking-[-0.01em]", className)} {...rest}>
      {children}
    </h2>
  );
}

export function Hint({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("w-full text-pretty text-center font-mono text-[11px] text-muted", className)}>{children}</p>;
}

