import Reveal from "./Reveal";

const STEPS: { title: string; body: string; tag?: { label: string; green?: boolean } }[] = [
  {
    title: "Connect your bank",
    body: "Read-only, through Plaid. Quid can see your balance and income, and it can never touch the account or your login.",
    tag: { label: "PLAID · READ-ONLY" },
  },
  {
    title: "It watches your cash flow",
    body: "The agent tracks what's coming in and going out, and spots you heading short days before it happens.",
    tag: { label: "ALWAYS ON" },
  },
  {
    title: "It advances the gap",
    body: "Before you dip below zero, Quid advances what you need, up to the cap you set. No fee on the advance.",
    tag: { label: "$0 PER ADVANCE", green: true },
  },
  {
    title: "It repays itself on payday",
    body: "The moment your wages land, Quid pays itself back and stands down. Nothing for you to do.",
    tag: { label: "AUTOMATIC" },
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="kicker">How it works</p>
          <h2 id="how-title" className="h-display text-[26px] sm:text-[30px] lg:text-[34px] mt-3">
            Set it up once. It runs itself.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.55] text-pretty">
            Two minutes of setup, then Quid handles the tight weeks on its own.
          </p>
        </Reveal>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 50} className="h-full">
              <div className="card card-hover p-6 h-full flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="avq w-10 h-10 text-[18px]">{i + 1}</span>
                  {step.tag && (
                    <span className={`tag ${step.tag.green ? "tag-g" : ""}`}>{step.tag.label}</span>
                  )}
                </div>
                <h3 className="font-display font-bold text-[17px] tracking-[-0.01em] text-balance mt-1">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.5] text-pretty">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
