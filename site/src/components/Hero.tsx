import type { CSSProperties } from "react";
import Phone from "./Phone";

const at = (ms: number) => ({ "--ad": `${ms}ms` } as CSSProperties);

export default function Hero() {
  return (
    <section className="px-5 sm:px-8 pt-12 pb-16 sm:pt-16 lg:pt-20 lg:pb-24" aria-label="Introduction">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">
        <div className="flex flex-col items-start gap-6">
          <p className="kicker rise-in" style={at(0)}>
            Personal money agent · Early access
          </p>
          <h1
            className="h-display font-extrabold text-[34px] sm:text-[44px] lg:text-[50px] rise-in"
            style={at(40)}
          >
            Money before payday, <span className="hl">handled for you.</span>
          </h1>
          <p className="text-[17px] sm:text-lg leading-[1.55] text-pretty max-w-[52ch] rise-in" style={at(80)}>
            Quid watches your cash flow, sees a shortfall coming, and quietly advances you the
            gap. Then it pays itself back the moment your wages land. You don't lift a finger.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto rise-in" style={at(120)}>
            <a href="#waitlist" className="btn btn-primary">
              Get early access
            </a>
            <a href="/demo.html" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Try the demo
            </a>
          </div>
          <p className="font-mono font-bold text-[12px] text-muted rise-in" style={at(160)}>
            No fees per advance, ever. Free covers up to $50, no card required.
          </p>
        </div>

        <div className="relative w-fit mx-auto pt-10 pb-10 sm:px-10" aria-hidden="true">
          <div className="rise-in" style={at(150)}>
            <Phone />
          </div>
          <div className="absolute top-2 right-[-6px] sm:right-0 z-10 w-[256px] rotate-2">
            <div className="drop-in card p-3.5 flex gap-2.5 items-start" style={at(700)}>
              <div className="avq w-[34px] h-[34px] rounded-[10px] text-[17px] shrink-0">Q</div>
              <div className="min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-bold text-[13px]">Quid</span>
                  <span className="font-mono text-muted text-[10px]">now</span>
                </div>
                <p className="text-[13px] leading-[1.35]">
                  Heads up, you'll be $180 short on the 28th. I can cover it.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-[-6px] sm:left-0 z-10 w-[232px] -rotate-2 hidden sm:block">
            <div className="rise-in card p-3.5" style={at(950)}>
              <span className="tag tag-g text-[10px]">SETTLED</span>
              <p className="text-[13px] font-semibold leading-snug mt-2">
                All square. I paid myself back when your wages landed.
              </p>
              <div className="flex justify-between font-mono text-[11px] mt-2">
                <span className="text-muted">QUID SCORE</span>
                <b className="tabular-nums">660 ▲</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
