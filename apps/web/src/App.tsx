import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useAuthStore } from "./stores/authStore";
import { useOfflineStore } from "./stores/offlineStore";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { JoinKitchen } from "./pages/JoinKitchen";
import { KitchenOnboarding } from "./pages/KitchenOnboarding";
import { ChefDashboard } from "./pages/ChefDashboard";
import { StationView } from "./pages/StationView";

function App() {
  const { initialize } = useAuthStore();
  const { initialize: initializeOffline } = useOfflineStore();

  useEffect(() => {
    initialize();
    initializeOffline();
  }, [initialize, initializeOffline]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/join" element={<JoinKitchen />} />
        <Route path="/join/:code" element={<JoinKitchen />} />
        <Route path="/kitchen/new" element={<KitchenOnboarding />} />
        <Route path="/dashboard" element={<ChefDashboard />} />
        <Route path="/station/:id" element={<StationView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
