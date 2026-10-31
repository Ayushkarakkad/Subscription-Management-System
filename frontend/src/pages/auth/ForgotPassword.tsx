import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto mb-3 shadow-lg shadow-blue-500/30">
            B
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Check Your Inbox
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              If an account with <strong>{email}</strong> exists, reset instructions have been sent.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>

            <div className="text-center pt-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


export default ForgotPassword;
