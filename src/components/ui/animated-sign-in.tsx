"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../assets/apple-touch-icon.png";
import { supabase } from "../../lib/supabase";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole] = useState("student");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              grade: grade,
              role: selectedRole
            }
          }
        });
        if (signUpError) throw signUpError;
        alert(t('checkEmail'));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/5 rounded-full blur-[120px] animate-pulse keep-colors" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-400/5 rounded-full blur-[120px] animate-pulse delay-700 keep-colors" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/80 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-zinc-950 rounded-3xl rotate-12 flex items-center justify-center shadow-lg transform hover:rotate-0 transition-transform duration-500 overflow-hidden border border-white/5 group">
            <img src={logo} className="w-full h-full object-cover -rotate-12 group-hover:rotate-0 transition-transform" />
          </div>

          <div className="text-center mt-10 mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              {isSignUp ? t('createAccount') : t('welcome')}
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              {isSignUp ? t('joinClubSubtitle') : t('signInToContinue')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-2xl text-red-400 text-[10px] font-bold uppercase tracking-widest text-center animate-shake backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/5 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all shadow-inner text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('grade')}</label>
                  <div className="relative">
                    <select
                      required
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/5 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all appearance-none cursor-pointer shadow-inner text-sm font-medium"
                    >
                      <option value="" disabled className="bg-zinc-900">{t('selectGrade')}</option>
                      <option value="9" className="bg-zinc-900">9</option>
                      <option value="10" className="bg-zinc-900">10</option>
                      <option value="11" className="bg-zinc-900">11</option>
                      <option value="12" className="bg-zinc-900">12</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('emailPlaceholder')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                className={`w-full bg-zinc-950/50 border ${isEmailFocused ? 'border-yellow-400/50' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all shadow-inner text-sm font-medium`}
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('passwordPlaceholder')}</label>
                {!isSignUp && <a href="#" className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">{t('forgotPassword')}</a>}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className={`w-full bg-zinc-950/50 border ${isPasswordFocused ? 'border-yellow-400/50' : 'border-white/5'} text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all shadow-inner text-sm font-medium`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-black font-bold uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-lg shadow-yellow-400/20"
            >
              {loading ? t('loading') : (isSignUp ? t('signUp') : t('login'))}
            </button>
          </form>

          <div className="flex items-center gap-3 my-8 opacity-50">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full py-4 px-4 rounded-2xl border border-white/5 hover:border-yellow-400/50 text-zinc-400 hover:text-yellow-400 transition-all flex items-center justify-center gap-3 bg-zinc-950/50 shadow-inner"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-bold text-[10px] uppercase tracking-widest leading-none">{t('googleSignIn')}</span>
          </button>

          <p className="text-center mt-10 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {isSignUp ? t('alreadyHaveAccount') : t('noAccount')}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white hover:text-yellow-400 hover:underline transition-colors mt-2 block w-full"
            >
              {isSignUp ? t('login') : t('signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
