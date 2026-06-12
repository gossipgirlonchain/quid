import Reveal from "./Reveal";

const TIERS: {
  name: string;
  price: string;
  cap: string;
  blurb: string;
  popular?: boolean;
}[] = [
  { name: "Free", price: "$0", cap: "$50", blurb: "No card, no commitment. Quid covers the small stuff." },
  { name: "Starter", price: "$5", cap: "$100", blurb: "For the odd tight week before payday." },
  {
    name: "Plus",
    price: "$9",
    cap: "$250",
    blurb: "Room for rent-sized surprises. Most people land here.",
    popular: true,
  },
  { name: "Pro", price: "$15", cap: "$500", blurb: "The full ceiling, for bigger gaps." },
];

export default function Pricing() {
  return (
    <section id="pricing" className="px-5 sm:px-8 py-16 sm:py-24" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="kicker">Pricing</p>
          <h2 id="pricing-title" className="h-display text-[26px] sm:text-[30px] lg:text-[34px] mt-3">
            Pick your ceiling.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.55] text-pretty">
            Your plan sets how much Quid can cover you for. Everything else is the same on every
            tier.
          </p>
        </Reveal>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 50} className="h-full">
              <div
                className={`card card-hover p-6 h-full flex flex-col gap-4 relative ${
                  tier.popular ? "bg-quid shadow-[8px_8px_0_#070E36] lg:-translate-y-2" : ""
                }`}
              >
                {tier.popular && (
                  <span className="tag tag-ink absolute -top-[15px] left-1/2 -translate-x-1/2 whitespace-nowrap">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="font-display font-bold text-[18px] tracking-[-0.01em]">{tier.name}</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="bignum text-[36px] tabular-nums">{tier.price}</span>
                  <span className="font-mono font-bold text-[12px]">/MO</span>
                </div>
                <div className="divide" />
                <div>
                  <div className={`text-[13px] ${tier.popular ? "text-ink" : "text-muted"}`}>
                    Borrow up to
                  </div>
                  <div className="font-display font-bold text-[24px] tabular-nums tracking-[-0.02em]">
                    {tier.cap}
                  </div>
                </div>
                <p className="text-[14px] leading-[1.5] text-pretty">{tier.blurb}</p>
                <a href="#waitlist" className={`btn w-full mt-auto ${tier.popular ? "" : "btn-ghost"}`}>
                  Get early access
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center flex flex-col items-center gap-3">
          <p className="font-mono font-bold text-[14px]">No fees per advance, ever. Just your plan.</p>
          <p className="text-[14px] text-muted text-pretty max-w-[58ch]">
            Your real limit is the lower of your plan's cap and the safe ceiling Quid works out
            from your verified income, so a plan never lets you borrow more than you can repay.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
