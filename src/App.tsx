import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from './components/ui/animated-shader-hero';
import LoginPage from './components/ui/animated-sign-in';
import { LanguageSwitcher } from './components/ui/language-switcher';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { 
  Users, Calendar, LogOut, Search, BookOpen, Award, DollarSign,
  Bell, ChevronRight, LayoutDashboard, Database, 
  ShieldCheck, ArrowUpRight, ArrowDownRight
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
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-zinc-800/50 text-yellow-400' 
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}
              >
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-yellow-400/10' : 'group-hover:bg-white/5'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                </div>
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-5 bg-yellow-400 rounded-full" />}
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
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              {t('greetings')}, <span className="text-yellow-400">{currentUser?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-zinc-500 mt-2 text-base font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              {t('clubTagline')} • <span className="text-zinc-400 capitalize">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-yellow-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')} 
                  className="bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-6 py-3 w-72 focus:outline-none focus:border-yellow-400/50 focus:w-80 transition-all text-sm font-medium text-white"
                />
             </div>
             <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-yellow-400 hover:border-yellow-400/30 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-yellow-400 rounded-full ring-2 ring-black" />
             </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capital Resources */}
          <div className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl transition-all duration-300 hover:border-yellow-400/20 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <img src={cashIcon} alt="" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px]">{t('currentBalance')}</div>
                <div className="flex items-center gap-1 text-green-400 text-[10px] font-bold mt-2 bg-green-400/5 px-2 py-1 rounded-md border border-green-400/10">
                  <ArrowUpRight className="w-3 h-3" /> 2.4%
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-zinc-600 font-bold text-xl uppercase">YB</span>
                <span className="text-5xl font-bold text-white tracking-tight tabular-nums">
                  ${animatedBalance}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          <div className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl transition-all duration-300 hover:border-green-400/20 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <img src={profilesIcon} alt="" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px]">{t('academicPerf')}</div>
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white tracking-tight tabular-nums mb-4">
                92.4 <span className="text-xl text-zinc-600">%</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-green-400 transition-all duration-1000" />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">Top 5%</div>
              </div>
            </div>
          </div>

          {/* Active Missions */}
          <div className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl transition-all duration-300 hover:border-zinc-700 shadow-sm flex flex-col justify-between min-h-[220px]">
             <div className="flex justify-between items-start">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <img src={missionsIcon} alt="" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px]">{t('activeMissions')}</div>
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white tracking-tight">
                04 <span className="text-xl text-zinc-600">/ 12</span>
              </div>
              <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-[2px] mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                2 Priority Challenges
              </div>
            </div>
          </div>

          {/* Club Status */}
          <div className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl transition-all duration-300 hover:border-zinc-700 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <img src={medalIcon} alt="" className="w-10 h-10 object-contain" />
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px] mb-2">{t('rank')}</div>
                <div className="text-[9px] font-bold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-700">
                  Elite
                </div>
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white tracking-tight">
                Diamond
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px] mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                Certified Member
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-yellow-400 rounded-full" />
                  <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{t('availableMissions')}</h2>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[2px]">{t('missionsDesc')}</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-[2px] hover:border-zinc-700 transition-all text-zinc-400">
                  {t('viewStore')}
                </button>
              </div>

              <div className="space-y-4">
                {cases.map((mission, idx) => (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-10 group relative transition-all duration-300 hover:border-yellow-400/20">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-400/10">
                            {t('strategic')}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors leading-tight">{mission.title}</h3>
                        <p className="text-zinc-500 text-base leading-relaxed line-clamp-2 max-w-2xl">{mission.description}</p>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end min-h-[140px]">
                        <div>
                          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">{t('reward')}</div>
                          <div className="text-4xl font-bold text-white tabular-nums tracking-tight">+${mission.reward}</div>
                        </div>
                        <div className="space-y-4">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-end gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {t('deadline')}: {mission.deadline}
                          </div>
                          <button 
                            className="px-8 py-3.5 bg-transparent border border-zinc-700 text-zinc-200 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:border-yellow-400 hover:text-yellow-400 transition-all flex items-center gap-2"
                            onClick={() => awardYBD(mission.reward * 0.8, mission.title)}
                          >
                            {t('accept')} <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Activity Column */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <section className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 h-full shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('activityFeed')}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{t('live')}</span>
                  </div>
               </div>

               <div className="space-y-1 mt-4">
                 {transactions.slice(0, 6).map((tx, idx) => (
                   <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-zinc-800 transition-all duration-200 group/item cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300
                        ${tx.amount > 0 ? 'bg-zinc-800 border-zinc-700 text-green-400' : 'bg-zinc-800 border-zinc-700 text-red-400'}`}>
                        {tx.amount > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-zinc-200 truncate pr-2 group-hover/item:text-yellow-400 transition-colors uppercase">{tx.reason}</h4>
                          <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pr-2 truncate">From {tx.createdBy}</p>
                          <p className="text-[10px] text-zinc-600 font-medium shrink-0">{tx.date}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>

               <button className="w-full mt-8 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] hover:text-white hover:border-zinc-600 transition-all">
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
        <div className="relative overflow-hidden bg-black min-h-screen">
          <div className="absolute top-8 left-8 z-50">
            <LanguageSwitcher />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-400/5 blur-[150px] rounded-full -z-10" />
          <LoginPage onLogin={handleLogin} />
        </div>
      );
    }
    
    return (
      <div className="flex min-h-screen bg-black text-white selection:bg-yellow-400 selection:text-black font-sans">
        <Sidebar role={currentRole} />
        
        <main className="flex-1 overflow-x-hidden relative bg-[#050505]">
          <div className="absolute top-8 right-8 z-50">
            <LanguageSwitcher />
          </div>
          
          <div className="relative">
            {currentPage === 'dashboard' && renderDashboard()}
            {currentPage !== 'dashboard' && (
               <div className="p-20 text-center flex flex-col items-center justify-center min-h-[80vh]">
                  <Database className="w-16 h-16 text-zinc-800 mb-8" />
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tight opacity-50">{t('moduleUnderDev')}</h2>
                  <button onClick={() => setCurrentPage('dashboard')} className="mt-8 text-yellow-500 font-bold uppercase tracking-[2px] text-[10px] hover:underline underline-offset-8">Return to Central Hub</button>
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
