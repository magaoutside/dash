import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import Cases from "@/react-app/pages/Cases";

import Upgrade from "@/react-app/pages/Upgrade";
import PvP from "@/react-app/pages/PvP";
import Market from "@/react-app/pages/Market";
import Profile from "@/react-app/pages/Profile";
import NotFound from "@/react-app/pages/NotFound";
import Secret from "@/react-app/pages/Secret";
import PvPHistory from "@/react-app/pages/PvPHistory";
import Mines from "@/react-app/pages/Mines";

import TonConnectProvider from "@/react-app/components/TonConnectProvider";
import ScrollToTop from "@/react-app/components/ScrollToTop";
import LoadingScreen from "@/react-app/components/LoadingScreen";
import { BalanceProvider } from "@/react-app/hooks/useBalance";

export default function App() {
  return (
    <LoadingScreen>
      <TonConnectProvider>
        <BalanceProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cases" element={<Cases />} />
              
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/pvp" element={<PvP />} />
              <Route path="/market" element={<Market />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/secret" element={<Secret />} />
              <Route path="/pvp-history" element={<PvPHistory />} />
              <Route path="/mines" element={<Mines />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </BalanceProvider>
      </TonConnectProvider>
    </LoadingScreen>
  );
}
