const LINKS: [string, string][] = [
  ["How it works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
  ["Get early access", "#waitlist"],
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper px-5 sm:px-8 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/quid-logo.png"
              alt=""
              width="40"
              height="40"
              className="w-10 h-10 rounded-[11px] border-[3px] border-paper/80"
            />
            <div>
              <div className="wordmark text-[22px]">Quid</div>
              <div className="font-mono text-[11px] text-paper/70 tracking-[0.06em]">
                YOUR PERSONAL MONEY AGENT
              </div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center min-h-[44px] font-mono font-bold text-[12px] uppercase tracking-[0.08em] hover:underline decoration-2 underline-offset-4"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="h-[2px] bg-paper/20 my-8" />

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
          <span className="tag bg-transparent border-paper/70 text-paper">BUILT ON CASPER</span>
          <span className="font-mono text-[12px] text-paper/70">© 2026 Quid · quid.fund</span>
        </div>
        <p className="mt-6 text-[13px] text-paper/70 text-pretty">
          This is general information, not financial advice.
        </p>
      </div>
    </footer>
  );
}
