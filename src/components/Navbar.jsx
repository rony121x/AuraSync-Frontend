import { ScanFace, LogOut } from "lucide-react";

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-tight">
          <ScanFace size={28} />
          <span>Aura<span className="text-white">Sync</span></span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}