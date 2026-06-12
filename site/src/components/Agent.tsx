import Reveal from "./Reveal";

export default function Agent() {
  return (
    <section
      id="agent"
      className="bg-muted border-y-[3px] border-ink px-5 sm:px-8 py-16 sm:py-24"
      aria-labelledby="agent-title"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="kicker text-paper">The agent</p>
          <h2 id="agent-title" className="h-display text-paper text-[26px] sm:text-[30px] lg:text-[34px] mt-3">
            An agent, not an app.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.55] text-pretty text-paper">
            Money apps wait for you to open them, notice the problem and sort it yourself. Quid
            notices first, acts on its own, and tells you what it did.
          </p>
        </Reveal>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <Reveal className="h-full">
            <div className="card card-hover p-6 h-full flex flex-col gap-3">
              <h3 className="font-display font-bold text-[17px] tracking-[-0.01em] text-balance">
                It acts, so you don't have to
              </h3>
              <p className="text-[15px] leading-[1.5] text-pretty">
                No low-balance alerts that wish you luck. When Quid sees you heading short, it
                covers you, then explains exactly what it did and why.
              </p>
              <div className="mt-auto rounded-[12px] border-[3px] border-ink bg-quid p-4">
                <div className="flex gap-2.5 items-start">
                  <div className="avq w-8 h-8 rounded-[9px] text-[15px] shrink-0" aria-hidden="true">
                    Q
                  </div>
                  <div>
                    <div className="kicker text-[10px] text-ink">Handled</div>
                    <p className="text-[14px] font-semibold leading-snug mt-0.5">
                      You were about to go short, so I covered it. You didn't have to do a thing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={50} className="h-full">
            <div className="card card-hover p-6 h-full flex flex-col gap-3">
              <h3 className="font-display font-bold text-[17px] tracking-[-0.01em] text-balance">
                Set your limit once
              </h3>
              <p className="text-[15px] leading-[1.5] text-pretty">
                Tell Quid the most it may ever cover. It stays under your cap and your plan's
                ceiling, and you can change either whenever you like.
              </p>
              <div className="mt-auto rounded-[12px] border-[3px] border-ink bg-paper p-4" aria-hidden="true">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-[13px]">Cover up to</span>
                  <span className="bignum text-[28px] tabular-nums">$200</span>
                </div>
                <div className="cap-track my-3">
                  <div className="cap-thumb" style={{ left: "56%" }} />
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted">$50</span>
                  <span>Plus plan, up to $250</span>
                </div>
                <div className="divide my-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[14px]">Auto-cover</span>
                  <div className="ptoggle">
                    <div className="knob" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100} className="h-full">
            <div className="card card-hover p-6 h-full flex flex-col gap-3">
              <h3 className="font-display font-bold text-[17px] tracking-[-0.01em] text-balance">
                It knows when to say no
              </h3>
              <p className="text-[15px] leading-[1.5] text-pretty">
                If an advance wouldn't repay comfortably from your verified income, Quid declines
                and offers the amount that would. That's what makes it safe to trust.
              </p>
              <div className="mt-auto rounded-[12px] border-[3px] border-ink bg-paper p-4">
                <div className="flex gap-2.5 items-start">
                  <div
                    className="avq bg-ink text-paper w-8 h-8 rounded-[9px] text-[15px] shrink-0"
                    aria-hidden="true"
                  >
                    Q
                  </div>
                  <div>
                    <div className="kicker text-[10px] text-ink">Quid</div>
                    <p className="text-[14px] font-semibold leading-snug mt-0.5">
                      I won't cover $400 this time. Your verified income can't repay that
                      comfortably by payday, and I'm not going to put you in a hole.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
