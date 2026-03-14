"use client";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { supabase } from "../../lib/supabase";

const LoginPage: React.FC<{ onLogin: (role: string) => void }> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | "admin">("student");

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value) setIsEmailValid(validateEmail(e.target.value));
    else setIsEmailValid(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && validateEmail(email)) {
      console.log("Form submitted:", { email, password, rememberMe, role: selectedRole });
      onLogin(selectedRole);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("particles") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const setSize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    setSize();
    window.addEventListener("resize", setSize);
    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number; color: string;
      constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1; this.speedX = (Math.random() - 0.5) * 0.5; this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = isDarkMode ? `rgba(245,166,35,${Math.random()*0.15})` : `rgba(0,0,100,${Math.random()*0.1})`;
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0; if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0; if (this.y < 0) this.y = canvas.height;
      }
      draw() { if (ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); } }
    }
    const particles: Particle[] = [];
    const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
    let raf: number;
    const animate = () => { 
      if (ctx) {
        ctx.clearRect(0,0,canvas.width,canvas.height); 
        particles.forEach(p=>{p.update();p.draw();}); 
        raf = requestAnimationFrame(animate); 
      }
    };
    animate();
    return () => { 
      window.removeEventListener("resize", setSize); 
      if (raf) cancelAnimationFrame(raf); 
    };
  }, [isDarkMode]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0A0E1A]">
      <canvas id="particles" className="absolute inset-0 w-full h-full pointer-events-none" />
      <button onClick={toggleDarkMode} className="absolute top-4 right-4 z-10 p-2 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-[#F5A623] transition-colors">
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl p-8 shadow-2xl border border-[rgba(245,166,35,0.15)] bg-[#111827] backdrop-blur-md">
          <div className="mb-8 text-center">
            <div className="text-2xl font-bold text-[#F5A623] mb-1" style={{ fontFamily: 'system-ui' }}>YB Business Club</div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('welcome')}</h1>
            <p className="text-[#6B7280]">{t('signInToContinue')}</p>
          </div>
          
          <div className="flex gap-2 mb-6 bg-[#1C2333] p-1 rounded-xl">
            {(['student', 'teacher', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${selectedRole === role 
                  ? 'bg-[#F5A623] text-black shadow' 
                  : 'text-white hover:bg-white/5'}`}
              >
                {t(role)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input type="email" value={email} onChange={handleEmailChange}
                onFocus={() => setIsEmailFocused(true)} onBlur={() => setIsEmailFocused(false)}
                placeholder={t('emailPlaceholder')} required
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all bg-[#1C2333] text-white placeholder-[#6B7280]
                  ${!isEmailValid && email ? 'border-red-500' : isEmailFocused ? 'border-[#F5A623]' : 'border-[#1F2937]'}`} />
              {!isEmailValid && email && <p className="text-red-500 text-xs mt-1">Please enter a valid email</p>}
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)}
                placeholder={t('passwordPlaceholder')} required
                className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all bg-[#1C2333] text-white placeholder-[#6B7280]
                  ${isPasswordFocused ? 'border-[#F5A623]' : 'border-[#1F2937]'}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#F5A623] transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-[#6B7280]">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="w-4 h-4 accent-[#F5A623]" />
                {t('rememberMe')}
              </label>
              <a href="#" className="text-[#F5A623] hover:underline">{t('forgotPassword')}</a>
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl bg-[#F5A623] hover:bg-[#e09520] text-black font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {t('signInAs', { role: t(selectedRole) })}
            </button>
          </form>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#1F2937]" />
            <span className="text-xs text-[#6B7280]">{t('orContinueWith')}</span>
            <div className="flex-1 h-px bg-[#1F2937]" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="w-full py-3.5 px-4 rounded-xl border border-[#1F2937] hover:border-[#F5A623] text-white hover:text-[#F5A623] transition-all flex items-center justify-center gap-3 bg-[#1C2333]/50 hover:bg-[#1C2333]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-semibold text-sm">{t('googleSignIn')}</span>
            </button>
          </div>
          <p className="text-center text-sm mt-8 text-[#6B7280]">
            {t('noAccount')} <a href="#" className="text-[#F5A623] hover:underline font-medium">{t('signUp')}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
