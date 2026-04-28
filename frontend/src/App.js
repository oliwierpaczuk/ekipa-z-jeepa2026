import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import News from "./pages/News";
import Squad from "./pages/Squad";
import Schedule from "./pages/Schedule";
import Results from "./pages/Results";
import Gallery from "./pages/Gallery";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/aktualnosci" element={<News />} />
              <Route path="/zawodnicy" element={<Squad />} />
              <Route path="/terminarz" element={<Schedule />} />
              <Route path="/wyniki" element={<Results />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <ChatBot />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: { background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
