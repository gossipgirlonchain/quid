import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Agent from "./components/Agent";
import TrustRow from "./components/TrustRow";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import Waitlist from "./components/Waitlist";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-quid focus:px-4 focus:py-3 focus:border-[3px] focus:border-ink focus:rounded-[10px] focus:font-bold"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Agent />
        <TrustRow />
        <Pricing />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
