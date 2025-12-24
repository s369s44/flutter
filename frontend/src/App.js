import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import BioPassHome from "./pages/BioPassHome";
import AuthPage from "./pages/AuthPage";
import PrivacyPage from "./pages/PrivacyPage";
import BioWalletPage from "./pages/BioWalletPage";
import UpdatesPage from "./pages/UpdatesPage";
import MemoryPage from "./pages/MemoryPage";
import "@/App.css";

function App() {
  return (
    <div className="App min-h-screen bg-[#0A0A1A]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BioPassHome />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/wallet" element={<BioWalletPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/memory" element={<MemoryPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          style: {
            background: 'rgba(10, 10, 26, 0.95)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            color: '#F8FAFC',
          },
        }}
      />
    </div>
  );
}

export default App;
