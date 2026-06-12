import Reveal from "./Reveal";

const ITEMS: { tag: string; body: string }[] = [
  {
    tag: "BUILT ON CASPER",
    body: "Every advance and repayment is recorded on the Casper network. Everything Quid does is on the record, and you can check it.",
  },
  {
    tag: "NO FEES PER ADVANCE",
    body: "No interest, no tips, no late fees, no per-advance charges. Your monthly plan is the only thing you ever pay.",
  },
  {
    tag: "READ-ONLY VIA PLAID",
    body: "Bank-grade connection through Plaid. Quid reads balances and income to do its job. It cannot move money in your bank account.",
  },
];

export default function TrustRow() {
  return (
    <section id="trust" className="px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="trust-title">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="kicker">Trust</p>
          <h2 id="trust-title" className="h-display text-[26px] sm:text-[30px] lg:text-[34px] mt-3">
            The boring, important bits.
          </h2>
        </Reveal>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item, i) => (
            <Reveal key={item.tag} delay={i * 50} className="h-full">
              <div className="card card-hover p-6 h-full flex flex-col gap-3">
                <span className="tag self-start">{item.tag}</span>
                <p className="text-[15px] leading-[1.5] text-pretty">{item.body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={150} className="h-full">
            <div className="card card-hover p-6 h-full flex flex-col gap-3">
              <span className="tag self-start">THE QUID SCORE</span>
              <p className="text-[15px] leading-[1.5] text-pretty">
                Repay on time and your score climbs, which earns a higher safe ceiling over time.
              </p>
              <div className="mt-auto flex flex-col gap-2.5">
                <span className="scorechip self-start">
                  <span className="st">QUID SCORE</span> <b className="tabular-nums">642</b>
                </span>
                <div className="bar" aria-hidden="true">
                  <span className="bar-fill" style={{ width: "46%" }} />
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="font-bold">TRUSTED</span>
                  <span className="text-muted">108 pts to PRIME</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
