import { useState } from "react";
import Reveal from "./Reveal";

const FAQS: [string, string][] = [
  [
    "Is this a loan?",
    "It does a similar job, but it's built differently. Quid advances money against wages you've already earned, charges no interest and no per-advance fees, and repays itself automatically on payday. No application, no credit check, no debt that rolls over. It is not a payday loan.",
  ],
  [
    "How do you make money?",
    "Your monthly plan, and that's it. The plan sets your ceiling: Free covers up to $50, Pro up to $500. Because we earn nothing per advance, we have no reason to nudge you into borrowing more than you should.",
  ],
  [
    "Is my bank data safe?",
    "Your bank connects through Plaid, the same service most major banking apps use. The connection is read-only and encrypted. Quid can see balances and income, it can't see your login, and it can't move money in your account.",
  ],
  [
    "What if I can't repay?",
    "Quid only advances what your verified income can comfortably cover, and it only repays itself when your wages actually land. If payday slips, it waits. No late fees, no interest, no collectors. Your cap may tighten until things steady, and that's the lot.",
  ],
  [
    "When can I get it?",
    "We're opening early access in small groups through 2026. Join the waitlist below and you'll get an invite when a spot opens. The free plan needs no card, so you can try it properly the day you're in.",
  ],
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="faq-title">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="kicker">FAQ</p>
          <h2 id="faq-title" className="h-display text-[26px] sm:text-[30px] lg:text-[34px] mt-3">
            Questions, answered straight.
          </h2>
        </Reveal>
        <Reveal className="mt-10">
          <div className="card overflow-hidden">
            {FAQS.map(([question, answer], i) => {
              const isOpen = open === i;
              return (
                <div key={question} className={i > 0 ? "border-t-[3px] border-ink" : ""}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left font-bold text-[16px] cursor-pointer focus-visible:outline-offset-[-4px]"
                    >
                      {question}
                      <span
                        aria-hidden="true"
                        className={`grid place-items-center w-7 h-7 shrink-0 border-2 border-ink rounded-[8px] font-mono font-bold text-[16px] transition-transform duration-150 ease-out ${
                          isOpen ? "rotate-45 bg-quid" : "bg-paper"
                        }`}
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={`faq-panel-${i}`} className="rise-in px-5 sm:px-6 pb-5 -mt-1">
                      <p className="text-[15px] leading-[1.55] text-pretty max-w-[62ch]">{answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
