import { useRef, useState, useEffect } from "react";
import { Camera, Lock, MapPin, Loader2 } from "lucide-react";
import { auth } from "../services/api";

export default function Login() {
  const videoRef = useRef(null);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userContext, setUserContext] = useState(null);
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [locError, setLocError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const initHardware = async () => {
      if (step === 1) {
        try {
          // 1. Await the Camera FIRST
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
          
          if (videoRef.current && isMounted) {
            videoRef.current.srcObject = stream;
          }

          // 2. ONLY AFTER the camera is successfully running, ask for Location
          if ("geolocation" in navigator && isMounted) {
            navigator.geolocation.getCurrentPosition(
              (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              (err) => setLocError("Location access required for campus geofencing.")
            );
          } else if (isMounted) {
            setLocError("Geolocation not supported by your browser.");
          }

        } catch (err) {
          console.error("Hardware Init Error:", err);
          if (isMounted) setError("Camera access denied or timed out. Please check browser permissions.");
        }
      }
    };

    initHardware();

    return () => {
      isMounted = false;
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [step]);

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  const handleScan = async () => {
    setLoading(true); setError("");
    try {
      const res = await auth.scanFace({ image: captureFrame() });
      setUserContext(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Face not recognized. Try again.");
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!location.lat || !location.lon) return setError(locError || "Waiting for location data. Please ensure GPS is on.");
    
    setLoading(true); setError("");
    try {
      const res = await auth.verify({ 
        email: userContext.email, password, lat: location.lat, lon: location.lon
      });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Incorrect password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-slate-400 text-sm">Secure biometric authentication</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">{error}</div>}

      {step === 1 ? (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] rounded-full overflow-hidden border-4 border-slate-800 mb-6 bg-slate-950">
            <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]" />
            {loading && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
          </div>
          <button onClick={handleScan} disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Scanning..." : <><Camera size={20}/> Scan Face</>}
          </button>
          <p className="mt-6 text-sm text-slate-400">New here? <a href="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create an account</a></p>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl mb-6 text-center border border-slate-800">
            <p className="text-sm text-slate-400">Identified as</p>
            <p className="font-semibold text-lg text-blue-400">{userContext.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="password" required autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 bg-slate-950 p-2 rounded border border-slate-800">
             <MapPin size={14} className={location.lat ? "text-green-500" : "text-orange-500 animate-pulse"} />
             {location.lat ? "Campus Geolocation Secured" : "Acquiring GPS Signal..."}
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loading ? "Verifying..." : <><Lock size={18}/> Unlock Dashboard</>}
          </button>
          <button type="button" onClick={() => setStep(1)} className="w-full py-2 text-sm text-slate-400 hover:text-white transition">Not you? Rescan face</button>
        </form>
      )}
    </div>
  );
}