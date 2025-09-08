import { Routes, Route } from "react-router-dom";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { Navigation } from "@/components/ui/navigation";
import { Toaster } from "@/components/ui/sonner";
import TranscribePage from "@/pages/TranscribePage";
import DoctorPage from "@/pages/DoctorPage";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

function App() {
  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transcribe" element={<TranscribePage />} />
            <Route path="/doctor" element={<DoctorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </ReactQueryProvider>
  );
}

export default App;