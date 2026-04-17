import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";

export default function App() {
  const isAuthenticated = !!localStorage.getItem("user");

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
        <Navbar />
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
          <Routes>
            <Route path="/" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}