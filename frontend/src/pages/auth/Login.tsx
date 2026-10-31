import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Briefcase } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data?.success && res.data.data) {
        login(res.data.data.token, res.data.data.user);
        success(`Welcome back, ${res.data.data.user.name}!`);

        const role = res.data.data.user.role;
        if (role === "ADMIN") navigate("/dashboard/admin");
        else if (role === "STAFF") navigate("/dashboard/staff");
        else navigate("/dashboard/customer");
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3 shadow-lg shadow-blue-500/30">
            B
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Brightloop Software
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Subscription Management Platform
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            ⚡ Quick Demo Accounts
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill("admin@brightloop.io")}
              className="py-1.5 px-2 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("staff@brightloop.io")}
              className="py-1.5 px-2 bg-white hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> Staff
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("customer@brightloop.io")}
              className="py-1.5 px-2 bg-white hover:bg-amber-50 hover:text-amber-600 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Client
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? "Signing in..." : "Sign in to Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            New enterprise customer?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};


export default Login;
