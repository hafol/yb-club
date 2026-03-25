"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F5A623]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F5A623]/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-[#0D1117]/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-[#1F2937] shadow-2xl relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-[#F5A623] to-[#FF8C00] rounded-3xl rotate-12 flex items-center justify-center shadow-lg transform hover:rotate-0 transition-transform duration-500">
            <ShieldCheck size={48} className="text-white -rotate-12" />
          </div>

          <div className="text-center mt-10 mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              {isSignUp ? t('createAccount') : t('welcome')}
            </h1>
            <p className="text-[#6B7280] text-sm">
              {isSignUp ? t('joinClubSubtitle') : t('signInToContinue')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#6B7280] ml-1 uppercase tracking-wider">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#1C2333] border border-[#1F2937] text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-[#F5A623] focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#6B7280] ml-1 uppercase tracking-wider">{t('grade')}</label>
                  <select
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#1C2333] border border-[#1F2937] text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-[#F5A623] focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>{t('selectGrade')}</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#6B7280] ml-1 uppercase tracking-wider">{t('emailPlaceholder')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                className={`w-full bg-[#1C2333] border ${isEmailFocused ? 'border-[#F5A623]' : 'border-[#1F2937]'} text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-[#F5A623] focus:border-transparent outline-none transition-all`}
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{t('passwordPlaceholder')}</label>
                {!isSignUp && <a href="#" className="text-[#F5A623] text-xs hover:underline">{t('forgotPassword')}</a>}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className={`w-full bg-[#1C2333] border ${isPasswordFocused ? 'border-[#F5A623]' : 'border-[#1F2937]'} text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-[#F5A623] focus:border-transparent outline-none transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#F5A623]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#F5A623] to-[#FF8C00] text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-[#F5A623]/20"
            >
              {loading ? t('loading') : (isSignUp ? t('signUp') : t('login'))}
            </button>
          </form>

          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-[#1F2937]" />
            <span className="text-xs text-[#6B7280]">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-[#1F2937]" />
          </div>

          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full py-3.5 px-4 rounded-xl border border-[#1F2937] hover:border-[#F5A623] text-white hover:text-[#F5A623] transition-all flex items-center justify-center gap-3 bg-[#1C2333]/50 hover:bg-[#1C2333]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-semibold text-sm">{t('googleSignIn')}</span>
          </button>

          <p className="text-center text-sm mt-8 text-[#6B7280]">
            {isSignUp ? t('alreadyHaveAccount') : t('noAccount')}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#F5A623] hover:underline font-medium"
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
