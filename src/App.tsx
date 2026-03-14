import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from './components/ui/animated-shader-hero';
import LoginPage from './components/ui/animated-sign-in';
import { LanguageSwitcher } from './components/ui/language-switcher';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { 
  Users, Award, BookOpen, TrendingUp, DollarSign, 
  Calendar, LogOut, Search, 
  Bell, ChevronRight, LayoutDashboard, Database, 
  ShieldCheck, ArrowUpRight, ArrowDownRight,
  TrendingUp, Award, BookOpen, DollarSign
} from 'lucide-react';

import cashIcon from './assets/dashboard/cash.png';
import profilesIcon from './assets/dashboard/profiles.png';
import missionsIcon from './assets/dashboard/missions.png';
import medalIcon from './assets/dashboard/medal.png';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: string;
  balance: number;
  avatar?: string;
}

interface Transaction {
  id: string;
  to: string;
  amount: number;
  reason: string;
  date: string;
  createdBy: string;
}

interface Grade {
  id: string;
  subject: string;
  score: number;
  comment: string;
  date: string;
}

interface Case {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  status: 'active' | 'closed';
}

const mockStudents: UserData[] = [
  { id: '1', name: 'Alice Chen', email: 'alice@school.edu', role: 'student', grade: '10A', balance: 2450, avatar: 'AC' },
  { id: '2', name: 'Bob Rodriguez', email: 'bob@school.edu', role: 'student', grade: '10A', balance: 1820, avatar: 'BR' },
  { id: '3', name: 'Carol Kim', email: 'carol@school.edu', role: 'student', grade: '11B', balance: 3210, avatar: 'CK' },
  { id: '4', name: 'David Patel', email: 'david@school.edu', role: 'student', grade: '10A', balance: 980, avatar: 'DP' },
];

const mockTransactions: Transaction[] = [
  { id: 't1', to: 'Alice Chen', amount: 250, reason: 'Case submission - Market Research', date: '2h ago', createdBy: 'Teacher' },
  { id: 't2', to: 'Bob Rodriguez', amount: -50, reason: 'Late attendance', date: '1d ago', createdBy: 'Admin' },
  { id: 't3', to: 'Carol Kim', amount: 500, reason: 'Winning pitch competition', date: '3d ago', createdBy: 'Teacher' },
];

const mockGrades: Grade[] = [
  { id: 'g1', subject: 'Business Fundamentals', score: 92, comment: 'Excellent analysis', date: 'Yesterday' },
  { id: 'g2', subject: 'Marketing', score: 78, comment: 'Good but could improve creativity', date: '3 days ago' },
  { id: 'g3', subject: 'Economics', score: 85, comment: 'Solid understanding', date: '1 week ago' },
];

const mockCases: Case[] = [
  { id: 'c1', title: 'Develop a Sustainable Product Idea', description: 'Create a business plan for an eco-friendly product targeting Gen Z.', reward: 350, deadline: '2024-12-05', status: 'active' },
  { id: 'c2', title: 'Market Analysis for Local Cafe', description: 'Analyze competitors and propose marketing strategy.', reward: 200, deadline: '2024-11-28', status: 'active' },
];

function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [currentRole, setCurrentRole] = useState<'landing' | 'login' | 'student' | 'teacher' | 'admin'>('landing');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'cases' | 'grades' | 'leaderboard' | 'students' | 'attendance' | 'bank' | 'users'>('dashboard');
  const [balance, setBalance] = useState(2450);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [grades, setGrades] = useState<Grade[]>(mockGrades);
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [selectedStudent, setSelectedStudent] = useState<UserData>(mockStudents[0]);
  const [newTransactionAmount, setNewTransactionAmount] = useState(100);
  const [newTransactionReason, setNewTransactionReason] = useState('');
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  // Authentication Setup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleAuthUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) handleAuthUser(session);
      else setCurrentRole('landing');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthUser = (session: Session) => {
    let userRole = (session.user.user_metadata.role as any) || 'student';
    
    // System Admin Override for the owner
    if (session.user.email === 'pzhumash@gmail.com') {
      userRole = 'admin';
    }

    const user: UserData = {
      id: session.user.id,
      name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      role: userRole,
      grade: userRole === 'admin' ? undefined : '10B',
      balance: userRole === 'admin' ? 0 : 2450,
      avatar: session.user.user_metadata.avatar_url || 'U'
    };
    setCurrentUser(user);
    setCurrentRole(userRole);
  };

  // Animate balance
  useEffect(() => {
    if (currentRole === 'student' && balance > 0) {
      let start = Math.max(0, animatedBalance - 100);
      const target = balance;
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (target - start) * progress);
        setAnimatedBalance(current);
        if (progress < 1) requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }
  }, [balance, currentRole]);

  const handleLogin = (role: string) => {
    // Legacy simulated login - will be replaced by Supabase Auth
    const roleMap: Record<string, 'student' | 'teacher' | 'admin'> = { 
      student: 'student', 
      teacher: 'teacher', 
      admin: 'admin' 
    };
    const r = roleMap[role] || 'student';
    
    const user: UserData = {
      id: 'u1',
      name: role === 'student' ? 'Alex Rivera' : role === 'teacher' ? 'Ms. Elena Vargas' : 'Principal Torres',
      email: role === 'student' ? 'alex.r@school.edu' : role === 'teacher' ? 'elena.v@school.edu' : 'admin@ybclub.edu',
      role: r,
      grade: role === 'student' ? '10B' : undefined,
      balance: role === 'student' ? 2450 : 0,
      avatar: role === 'student' ? 'AR' : 'EV'
    };
    
    setCurrentUser(user);
    setCurrentRole(r);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentRole('landing');
    setCurrentUser(null);
  };

  const awardYBD = (amount: number, reason: string) => {
    if (amount <= 0 || !reason) return;
    const newBal = balance + amount;
    setBalance(newBal);
    
    const newTx: Transaction = {
      id: 'tx' + Date.now(),
      to: currentUser?.name || 'Student',
      amount,
      reason,
      date: 'Just now',
      createdBy: currentRole === 'admin' ? 'Admin' : 'Teacher'
    };
    setTransactions([newTx, ...transactions]);
    setShowAwardModal(false);
  };

  const Sidebar = ({ role }: { role: string }) => {
    const navItems = role === 'student' 
      ? [
          { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
          { id: 'cases', label: t('cases'), icon: BookOpen },
          { id: 'grades', label: t('grades'), icon: Award },
          { id: 'leaderboard', label: t('leaderboard'), icon: Users },
        ]
      : role === 'teacher'
      ? [
          { id: 'dashboard', label: t('teacherHub'), icon: Database },
          { id: 'students', label: t('students'), icon: Users },
          { id: 'attendance', label: t('attendance'), icon: Calendar },
          { id: 'cases', label: t('cases'), icon: BookOpen },
        ]
      : [
          { id: 'dashboard', label: t('dashboard'), icon: ShieldCheck },
          { id: 'bank', label: t('bank'), icon: DollarSign },
          { id: 'users', label: t('users'), icon: Users },
          { id: 'students', label: t('allStudents'), icon: Users },
        ];

    return (
      <aside className="w-72 bg-zinc-950/50 backdrop-blur-3xl border-r border-white/5 h-screen flex flex-col sticky top-0 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-500">
              <span className="text-zinc-950 font-black text-2xl drop-shadow-sm">Y</span>
            </div>
            <div>
              <div className="font-black text-2xl text-white tracking-tighter leading-none">YB CLUB</div>
              <div className="text-[9px] text-amber-500 font-bold tracking-[2px] mt-1 uppercase opacity-80 italic">Ecosystem</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[2px] px-4 mb-4">{t('mainMenu')}</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-amber-400/10 to-transparent text-amber-400' 
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-amber-400/20 shadow-lg shadow-amber-400/10' : 'group-hover:bg-white/10'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                </div>
                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-6 bg-amber-400 rounded-full blur-[1px]" />}
              </button>
            );
          })}
        </nav>
        
        <div className="p-6">
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 blur-3xl -mr-12 -mt-12 group-hover:bg-amber-400/10 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-amber-400 border border-white/10 overflow-hidden ring-2 ring-amber-400/20 group-hover:ring-amber-400 transition-all">
                  {currentUser?.avatar?.startsWith('http') ? (
                     <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser?.avatar || 'UN'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 shadow-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate leading-tight">{currentUser?.name}</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t(currentUser?.role || 'student')}</div>
              </div>
              <button 
                onClick={handleLogout} 
                className="w-10 h-10 bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="p-10 space-y-10 max-w-[1600px] mx-auto animate-fade-in">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl drop-shadow-2xl">
              {t('greetings')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">{currentUser?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-zinc-500 mt-4 text-lg font-medium tracking-wide flex items-center gap-3">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" />
              {t('clubTagline')} • <span className="text-amber-400/80 italic">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')} 
                  className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-6 py-4 w-72 focus:outline-none focus:border-amber-400/50 focus:w-80 transition-all text-sm font-medium"
                />
             </div>
             <button className="p-4 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl text-zinc-500 hover:text-amber-400 hover:border-amber-400/30 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-zinc-950" />
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Capital Resources */}
          <div className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:scale-[1.02] hover:border-amber-400/30 shadow-2xl flex flex-col justify-between min-h-[280px]">
            <div className="flex justify-between items-start">
              <div className="w-20 h-20 bg-amber-400/10 rounded-3xl flex items-center justify-center border border-amber-400/10 group-hover:scale-110 transition-transform duration-500">
                <img src={cashIcon} alt="" className="w-14 h-14 object-contain" />
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-2">{t('currentBalance')}</div>
                <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 uppercase">
                  <ArrowUpRight className="w-3 h-3" /> 2.4%
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-end gap-3">
                <span className="text-zinc-600 font-black text-3xl mb-1 italic">YB</span>
                <span className="text-6xl font-black text-white tabular-nums tracking-tighter group-hover:text-amber-400 transition-colors duration-500 font-mono italic underline decoration-amber-400/30 underline-offset-8">
                  ${animatedBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          <div className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:scale-[1.02] hover:border-emerald-400/30 shadow-2xl flex flex-col justify-between min-h-[280px]">
            <div className="flex justify-between items-start">
              <div className="w-20 h-20 bg-emerald-400/10 rounded-3xl flex items-center justify-center border border-emerald-400/10 group-hover:scale-110 transition-transform duration-500">
                <img src={profilesIcon} alt="" className="w-14 h-14 object-contain" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px]">{t('academicPerf')}</div>
              </div>
            </div>
            <div>
              <div className="text-6xl font-black text-white tabular-nums tracking-tighter mb-4 decoration-emerald-400/30 underline-offset-8 underline decoration-4">
                92.4 <span className="text-2xl text-zinc-600">%</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                  <div className="w-[92%] h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" />
                </div>
                Top 5%
              </div>
            </div>
          </div>

          {/* Active Missions */}
          <div className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:scale-[1.02] hover:border-blue-400/30 shadow-2xl flex flex-col justify-between min-h-[280px]">
             <div className="flex justify-between items-start">
              <div className="w-20 h-20 bg-blue-400/10 rounded-3xl flex items-center justify-center border border-blue-400/10 group-hover:scale-110 transition-transform duration-500">
                <img src={missionsIcon} alt="" className="w-14 h-14 object-contain" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px]">{t('activeMissions')}</div>
              </div>
            </div>
            <div>
              <div className="text-6xl font-black text-white tracking-tighter mb-2 italic">
                04 <span className="text-2xl text-zinc-500 italic opacity-50">/ 12</span>
              </div>
              <div className="text-[11px] text-blue-400 font-black uppercase tracking-[3px] mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                2 Priority Challenges
              </div>
            </div>
          </div>

          {/* Club Status */}
          <div className="group relative overflow-hidden bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-10 rounded-[3rem] transition-all duration-500 hover:scale-[1.02] hover:border-purple-400/30 shadow-2xl flex flex-col justify-between min-h-[280px]">
            <div className="flex justify-between items-start">
              <div className="w-20 h-20 bg-purple-400/10 rounded-3xl flex items-center justify-center border border-purple-400/10 group-hover:scale-110 transition-transform duration-500">
                <img src={medalIcon} alt="" className="w-14 h-14 object-contain" />
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px] mb-2">{t('rank')}</div>
                <div className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full uppercase tracking-widest border border-purple-500/20">
                  Elite
                </div>
              </div>
            </div>
            <div>
              <div className="text-6xl font-black text-white tracking-tighter italic drop-shadow-[0_4px_15px_rgba(192,132,252,0.4)] bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-100 to-purple-400">
                Diamond
              </div>
              <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-[2px] mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Certified Member
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Missions Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                   <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{t('availableMissions')}</h2>
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[3px] mt-1">{t('missionsDesc')}</p>
                   </div>
                </div>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-[2px] hover:bg-white/10 transition-all active:scale-95 text-zinc-200">
                  {t('viewStore')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cases.map((mission, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-white/5 rounded-[32px] p-8 overflow-hidden group relative hover:border-amber-400/40 transition-all duration-700 shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-amber-400/15 transition-all duration-1000" />
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black bg-amber-400/20 text-amber-500 px-3 py-1 rounded-full w-min uppercase tracking-widest border border-amber-400/20">
                          {t('strategic')}
                        </div>
                        <h3 className="text-2xl font-black text-white mt-1 group-hover:text-amber-400 transition-colors leading-tight italic">{mission.title}</h3>
                      </div>
                      <div className="text-right">
                         <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest leading-none">{t('reward')}</div>
                         <div className="text-3xl font-mono font-black text-white mt-2 group-hover:scale-110 transition-transform origin-right">+${mission.reward}</div>
                      </div>
                    </div>

                    <p className="text-zinc-500 text-sm leading-relaxed mb-10 line-clamp-2 font-medium opacity-80">{mission.description}</p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 relative z-10">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('deadline')}: {mission.deadline}</span>
                      </div>
                      <button 
                        className="group/btn relative h-12 w-44 bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-2xl overflow-hidden active:scale-95 transition-all shadow-xl shadow-white/5"
                        onClick={() => awardYBD(mission.reward * 0.8, mission.title)}
                      >
                         <span className="relative z-10 flex items-center justify-center gap-2">
                          {t('accept')} <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                         </span>
                         <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* Feed Section */}
            <section className="bg-zinc-900/30 backdrop-blur-3xl border border-white/5 rounded-[40px] p-8 h-full shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 blur-[100px] -z-10 group-hover:bg-amber-400/10 transition-colors duration-1000" />
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('activityFeed')}</h2>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">{t('live')}</span>
                  </div>
               </div>

               <div className="space-y-6">
                 {transactions.slice(0, 6).map((tx, idx) => (
                   <div key={idx} className="flex gap-4 p-4 rounded-[28px] hover:bg-white/5 transition-all duration-300 group/item border border-transparent hover:border-white/5 cursor-pointer">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500
                        ${tx.amount > 0 ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400 group-hover/item:rotate-12' : 'bg-red-400/10 border-red-400/20 text-red-400 group-hover/item:-rotate-12'}`}>
                        {tx.amount > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-white truncate max-w-[150px] group-hover/item:text-amber-400 transition-colors uppercase italic">{tx.reason}</h4>
                          <span className={`text-sm font-mono font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">From {tx.createdBy}</p>
                          <p className="text-[10px] text-zinc-700 font-mono italic">{tx.date}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>

               <button className="w-full mt-10 py-5 bg-white/5 border border-white/10 rounded-[28px] text-[10px] font-black text-zinc-500 uppercase tracking-[3px] hover:bg-white/10 hover:text-white transition-all">
                  {t('fullAuditLog')}
               </button>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (currentRole === 'landing') {
      return (
        <Hero 
          trustBadge={{ text: t('trustBadge'), icons: ["💼"] }}
          headline={{ line1: t('startJourney'), line2: t('businessJourney') }}
          subtitle={t('heroSubtitle')}
          buttons={{
            primary: { 
              text: t('joinClub'), 
              onClick: () => setCurrentRole('login') 
            },
            secondary: { 
              text: t('learnMore'), 
              onClick: () => window.open('#', '_blank') 
            }
          }}
          languageSwitcher={<LanguageSwitcher />}
        />
      );
    }
    
    if (currentRole === 'login') {
      return (
        <div className="relative overflow-hidden bg-black">
          <div className="absolute top-8 left-8 z-50 animate-fade-in">
            <LanguageSwitcher />
          </div>
          {/* Accent Glows for Login */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] rounded-full -z-10 animate-pulse" />
          <LoginPage onLogin={handleLogin} />
        </div>
      );
    }
    
    return (
      <div className="flex min-h-screen bg-black text-white selection:bg-amber-400 selection:text-black">
        <Sidebar role={currentRole} />
        
        <main className="flex-1 overflow-x-hidden relative">
          {/* Subtle Global Glows */}
          <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full -z-10 select-none pointer-events-none" />
          <div className="fixed bottom-0 left-[300px] w-[500px] h-[500px] bg-orange-600/5 blur-[100px] rounded-full -z-10 select-none pointer-events-none" />
          
          <div className="absolute top-10 right-10 z-50">
            <LanguageSwitcher />
          </div>
          
          <div className="relative">
            {currentPage === 'dashboard' && renderDashboard()}
            {/* Other pages would follow the same premium aesthetic */}
            {currentPage !== 'dashboard' && (
               <div className="p-20 text-center flex flex-col items-center justify-center animate-pulse">
                  <Database className="w-20 h-20 text-zinc-800 mb-8" />
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter opacity-50">{t('moduleUnderDev')}</h2>
                  <button onClick={() => setCurrentPage('dashboard')} className="mt-8 text-amber-500 font-bold uppercase tracking-[4px] text-xs hover:underline decoration-2 underline-offset-8">Return to Central Hub</button>
               </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden antialiased">
      {renderContent()}
    </div>
  );
}

export default App;
