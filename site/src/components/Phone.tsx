import { useEffect, useRef, useState } from "react";

/** Counts the projected balance up once the phone scrolls into view. */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          setValue(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return { ref, value };
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * Static recreation of the app prototype's home screen (web/quid-mockup.html).
 * Purely illustrative: no focusable elements, hidden from assistive tech.
 */
export default function Phone() {
  const { ref, value } = useCountUp(312.4);

  return (
    <div className="phone" aria-hidden="true">
      <div className="notch" />
      <div className="ph-status">
        <span>9:41</span>
        <span>100%</span>
      </div>
      <div className="ph-appbar">
        <span className="wordmark text-[23px]">Quid</span>
        <span className="scorechip">
          <span className="st">QUID SCORE</span> <b className="tabular-nums">642</b>
        </span>
      </div>

      <div className="flex flex-col gap-3.5 px-[18px] pt-3.5 pb-4">
        <div ref={ref} className="card bg-quid p-[18px]">
          <div className="kicker text-[11px] text-ink">You're covered</div>
          <div className="bignum text-[42px] tabular-nums mt-2 mb-1">{money(value)}</div>
          <p className="font-mono text-[13px] font-bold">
            Projected balance · payday in 5 days
          </p>
        </div>

        <div className="card p-[18px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[18px] tracking-[-0.01em]">
                Auto-cover
              </span>
              <span className="grid place-items-center w-6 h-6 border-2 border-ink rounded-full bg-paper font-mono text-[13px] font-bold">
                i
              </span>
            </div>
            <div className="ptoggle">
              <div className="knob" />
            </div>
          </div>
          <div className="divide my-3" />
          <div className="flex items-center justify-between">
            <span className="text-muted text-[13px]">Cover up to</span>
            <span className="bignum text-[30px] tabular-nums">$200</span>
          </div>
          <div className="cap-track my-3">
            <div className="cap-thumb" style={{ left: "58%" }} />
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-muted">$50</span>
            <span>Plus plan, up to $250</span>
          </div>
        </div>

        <div className="btn w-full bg-ink text-paper pointer-events-none">Need it now</div>

        <div className="tag self-center">
          <span className="livedot" /> QUID IS WATCHING
        </div>
      </div>

      <div className="ph-nav">
        <div className="on">
          <span className="dot" />
          Home
        </div>
        <div>
          <span className="dot" />
          Activity
        </div>
        <div>
          <span className="dot" />
          Profile
        </div>
      </div>
    </div>
  );
}
