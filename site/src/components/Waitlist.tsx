import { useState, type FormEvent } from "react";

export default function Waitlist() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(true);
      return;
    }
    try {
      localStorage.setItem("quid-waitlist-email", email);
    } catch {
      /* storage unavailable, carry on */
    }
    setError(false);
    setDone(true);
  };

  return (
    <section
      id="waitlist"
      className="bg-quid border-y-[3px] border-ink px-5 sm:px-8 py-16 sm:py-24"
      aria-labelledby="waitlist-title"
    >
      <div className="mx-auto max-w-2xl flex flex-col items-center text-center gap-5">
        <p className="kicker text-ink">Early access</p>
        <h2 id="waitlist-title" className="h-display text-[28px] sm:text-[34px] lg:text-[38px]">
          Be covered before you're next short.
        </h2>
        <p className="text-[16px] leading-[1.55] text-pretty max-w-[48ch]">
          Quid opens in small groups. Leave your email and we'll hold you a spot in the queue.
        </p>

        {done ? (
          <div role="status" className="card p-6 w-full max-w-md flex flex-col items-center gap-3 mt-2">
            <span className="tag tag-g">ON THE LIST</span>
            <p className="font-display font-bold text-[20px] tracking-[-0.01em]">
              Lovely, you're in the queue.
            </p>
            <p className="text-[14px] text-muted">
              We'll email you when your invite is ready. No spam, just the one email.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={submit}
              noValidate
              className="w-full max-w-lg flex flex-col sm:flex-row gap-3 mt-2"
            >
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input sm:flex-1"
                onChange={() => setError(false)}
              />
              <button type="submit" className="btn btn-ink shrink-0">
                Get early access
              </button>
            </form>
            {error && (
              <p
                role="alert"
                className="font-mono font-bold text-[12px] bg-paper border-2 border-ink rounded-[8px] px-3 py-1.5"
              >
                That email doesn't look right. Mind checking it?
              </p>
            )}
            <p className="font-mono font-bold text-[12px]">No spam. One email when it's your turn.</p>
          </>
        )}
      </div>
    </section>
  );
}
