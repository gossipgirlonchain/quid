import { QuidProvider, useQuid } from "./state";
import { AppBar, BottomNav, InstallBanner, PhoneShell, PushBanner } from "./components/Shell";
import { AdvanceSheet } from "./components/AdvanceSheet";
import { Connect, Login, SetBorrow, Welcome } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Active, Heads, Settled, Work } from "./screens/AdvanceFlow";
import { AutoCovered, Declined } from "./screens/Outcomes";
import { CashOut } from "./screens/CashOut";
import { Activity } from "./screens/Activity";
import { Profile } from "./screens/Profile";

function Router() {
  const { screen } = useQuid();
  switch (screen) {
    case "welcome":
      return <Welcome />;
    case "login":
      return <Login />;
    case "connect":
      return <Connect />;
    case "setborrow":
      return <SetBorrow />;
    case "home":
      return <Home />;
    case "heads":
      return <Heads />;
    case "work":
      return <Work />;
    case "active":
      return <Active />;
    case "settled":
      return <Settled />;
    case "autocover":
      return <AutoCovered />;
    case "declined":
      return <Declined />;
    case "cashout":
      return <CashOut />;
    case "activity":
      return <Activity />;
    case "profile":
      return <Profile />;
  }
}

function Shell() {
  const { inOnboarding } = useQuid();
  return (
    <PhoneShell>
      {!inOnboarding && <AppBar />}
      <Router />
      <PushBanner />
      <InstallBanner />
      <AdvanceSheet />
      {!inOnboarding && <BottomNav />}
    </PhoneShell>
  );
}

export default function App() {
  return (
    <QuidProvider>
      <Shell />
    </QuidProvider>
  );
}
