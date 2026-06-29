const LINKS: [string, string][] = [
  ["How it works", "#how"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-paper border-b-[3px] border-ink">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <a href="#main" className="flex items-center" aria-label="Quid, back to top">
            <img
              src="/quid-logo.png"
              alt=""
              width="40"
              height="40"
              className="w-10 h-10 rounded-[11px] border-[3px] border-ink"
            />
          </a>
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            {LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="inline-flex items-center min-h-[44px] font-semibold text-[15px] hover:underline decoration-[3px] underline-offset-[6px]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="/demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm hidden sm:inline-flex"
            >
              Try demo
            </a>
            <a href="#waitlist" className="btn btn-primary btn-sm">
              Get early access
            </a>
          </div>
        </div>
      </div>
      <nav
        className="md:hidden flex justify-center gap-6 border-t-2 border-ink/15 px-5"
        aria-label="Primary, compact"
      >
        {LINKS.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="inline-flex items-center min-h-[44px] font-mono font-bold text-[12px] uppercase tracking-[0.08em]"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
