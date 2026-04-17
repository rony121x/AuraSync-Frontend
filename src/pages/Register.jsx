import { useState, useRef, useEffect } from "react";
import { User, Mail, Lock, Camera, ArrowRight, ArrowLeft, Loader2, ShieldAlert, BookOpen } from "lucide-react";
import { auth } from "../services/api";

export default function Register() {
  const videoRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student", subject: "", admin_code: "" });

  useEffect(() => {
    if (step === 2 && !success) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => setError("Camera access denied."));
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [step, success]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNextStep = (e) => {
    e.preventDefault(); setError("");
    if (!formData.name || !formData.email || !formData.password) return setError("Please fill all fields.");
    if (formData.role === "teacher" && (!formData.subject || !formData.admin_code)) return setError("Teachers must enter a subject and access code.");
    setStep(2);
  };

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg");
  };

  const handleRegister = async () => {
    setLoading(true); setError("");
    try {
      await auth.register({ ...formData, image: captureFrame() });
      setSuccess(true);
      if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setTimeout(() => window.location.href = "/", 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-slate-900 rounded-2xl border border-green-500/30 text-center shadow-xl shadow-green-900/20">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><Camera size={32} /></div>
        <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-10 p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-slate-400 text-sm">{step === 1 ? "Step 1: Enter your details" : "Step 2: Register your face"}</p>
      </div>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm flex items-center gap-2"><ShieldAlert size={16} />{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleNextStep} className="space-y-4">
          <div className="relative"><User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input type="text" name="name" required placeholder="Full Name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={18} />
            <input type="email" name="email" required placeholder="Email Address" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="relative"><Lock className="absolute left-3 top-3 text-slate-500" size={18} />
            <input type="password" name="password" required placeholder="Password" value={formData.password} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none text-white">
            <option value="student">Student</option>
            <option value="teacher">Teacher / Admin</option>
          </select>

          {formData.role === "teacher" && (
            <>
              <div className="relative animate-in fade-in slide-in-from-top-2 mt-4">
                <BookOpen className="absolute left-3 top-3 text-slate-500" size={18} />
                <input type="text" name="subject" required placeholder="Subject (e.g. Mathematics)" value={formData.subject} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="relative animate-in fade-in slide-in-from-top-2 mt-4">
                <ShieldAlert className="absolute left-3 top-3 text-orange-500" size={18} />
                <input type="text" name="admin_code" required placeholder="Admin Access Code" value={formData.admin_code} onChange={handleInputChange} className="w-full bg-slate-950 border border-orange-500/50 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 outline-none text-orange-100 placeholder-orange-800/50" />
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium mt-4 flex items-center justify-center gap-2">Continue <ArrowRight size={18} /></button>
          <p className="mt-4 text-sm text-center text-slate-400">Already registered? <a href="/" className="text-blue-500">Log in</a></p>
        </form>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] rounded-full overflow-hidden border-4 border-slate-800 mb-6 bg-slate-950">
            <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1]" />
            {loading && <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
          </div>
          <button onClick={handleRegister} disabled={loading} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Registering..." : <><Camera size={20}/> Capture Face</>}
          </button>
          <button onClick={() => setStep(1)} disabled={loading} className="w-full mt-3 py-2 text-sm text-slate-400 flex justify-center gap-2"><ArrowLeft size={16}/> Back</button>
        </div>
      )}
    </div>
  );
}