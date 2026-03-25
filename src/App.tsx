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
  email?: string;
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
  mission_id?: number;
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

// Mock data removed in favor of Supabase fetching

function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [currentRole, setCurrentRole] = useState<'landing' | 'login' | 'student' | 'teacher' | 'admin'>('landing');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'cases' | 'grades' | 'leaderboard' | 'students' | 'attendance' | 'bank' | 'users' | 'missions_admin'>('dashboard');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserData | null>(null);
  const [newTransactionAmount, setNewTransactionAmount] = useState(100);
  const [newTransactionReason, setNewTransactionReason] = useState('');
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedUserForGrading, setSelectedUserForGrading] = useState<UserData | null>(null);
  const [newGrade, setNewGrade] = useState({ subject: '', score: 0, comment: '' });
  const [newMission, setNewMission] = useState({ title: '', description: '', reward: 0, deadline: '' });
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

  const handleAuthUser = async (session: Session) => {
    // Fetch profile from public.profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', profile, error);
    }

    let userRole = profile?.role || (session.user.user_metadata.role as any) || 'student';
    
    // System Admin Override for the owner
    if (session.user.email === 'pzhumash@gmail.com') {
      userRole = 'admin';
    }

    if (!profile) {
      // Fallback: Create profile if missing (helps existing users)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profile?.full_name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          avatar_url: profile?.avatar_url || session.user.user_metadata.avatar_url || 'U',
          role: userRole,
          grade: profile?.grade || session.user.user_metadata.grade || '10B'
        });
      if (upsertError) console.error('Error auto-creating profile:', upsertError);
    }

    const user: UserData = {
      id: session.user.id,
      name: profile?.full_name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      role: userRole,
      grade: profile?.grade || session.user.user_metadata.grade || '10B',
      balance: profile?.balance || 0,
      avatar: profile?.avatar_url || session.user.user_metadata.avatar_url || 'U'
    };
    
    setCurrentUser(user);
    setBalance(user.balance);
    setCurrentRole(userRole);
    
    fetchMissions();
    fetchTransactions(session.user.id);
    fetchGrades(session.user.id);
    if (userRole === 'admin') {
      fetchUsers();
    }

    // Subscribe to balance changes
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).balance !== undefined) {
             setBalance((payload.new as any).balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching missions:', error);
    }
    
    if (data) {
      setCases(data.map(m => ({
        id: m.id.toString(),
        title: m.title,
        description: m.description,
        reward: m.reward,
        deadline: m.deadline,
        status: m.status
      })));
    }
  };

  const fetchGrades = async (userId: string) => {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching grades:', error);
    }

    if (data) {
      setGrades(data.map(g => ({
        id: g.id.toString(),
        subject: g.subject,
        score: g.score,
        comment: g.comment,
        date: new Date(g.created_at).toLocaleDateString()
      })));
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (error) {
      console.error('Error fetching users:', error);
    }

    if (data) {
      setAllUsers(data.map(p => ({
        id: p.id,
        name: p.full_name,
        avatar: p.avatar_url,
        role: p.role,
        grade: p.grade,
        balance: p.balance
      })));
    }
  };

  const submitGrade = async () => {
    if (!selectedUserForGrading || !newGrade.subject || newGrade.score <= 0) {
      alert('Please fill all fields correctly');
      return;
    }

    const { error } = await supabase
      .from('grades')
      .insert([{
        user_id: selectedUserForGrading.id,
        subject: newGrade.subject,
        score: newGrade.score,
        comment: newGrade.comment
      }]);

    if (!error) {
      alert('Grade assigned successfully!');
      setShowGradingModal(false);
      setNewGrade({ subject: '', score: 0, comment: '' });
      // Refresh user data to show new average if needed
      fetchUsers();
    } else {
      console.error('Error assigning grade:', error);
      alert(`Error assigning grade: ${error.message}`);
    }
  };

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching transactions:', error);
    }

    if (data) {
      setTransactions(data.map(t => ({
        id: t.id.toString(),
        to: currentUser?.name || 'User',
        amount: t.amount,
        reason: t.reason,
        date: new Date(t.created_at).toLocaleDateString(),
        createdBy: t.created_by,
        mission_id: t.mission_id
      })));
    }
  };

  const createMission = async () => {
    if (!newMission.title || !newMission.description || !newMission.reward || !newMission.deadline) {
      alert('Please fill in all fields (Title, Description, Reward, and Deadline).');
      return;
    }

    const { data, error } = await supabase
      .from('missions')
      .insert([
        { 
          title: newMission.title, 
          description: newMission.description, 
          reward: newMission.reward, 
          deadline: newMission.deadline 
        }
      ]);

    if (!error) {
      console.log('Mission created:', data);
      alert('Mission created successfully!');
      setShowAddMissionModal(false);
      setNewMission({ title: '', description: '', reward: 0, deadline: '' });
      fetchMissions();
    } else {
      console.error('Error creating mission:', error);
      alert(`Error creating mission: ${error.message}`);
    }
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

  // handleLogin removed in favor of Supabase onAuthStateChange

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentRole('landing');
    setCurrentUser(null);
  };

  const awardYBD = async (amount: number, reason: string, missionId?: string) => {
    if (amount <= 0 || !reason || !currentUser) return;
    
    const { error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: currentUser.id,
          mission_id: missionId ? parseInt(missionId) : null,
          amount: Math.round(amount),
          reason,
          created_by: currentRole === 'admin' ? 'Admin' : 'Teacher'
        }
      ]);

    if (!error) {
      // Refresh balance and transactions
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', currentUser.id)
        .single();
      
      if (profile) {
        setBalance(profile.balance);
      }
      fetchTransactions(currentUser.id);
      setShowAwardModal(false);
      alert('Mission accepted! Reward added to your balance.');
    } else {
      console.error('Error rewarding student:', error);
      alert(`Failed to accept mission: ${error.message}`);
    }
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
          { id: 'missions_admin', label: 'Manage Missions', icon: BookOpen },
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

  const renderMissionsAdmin = () => {
    return (
      <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Mission Management</h1>
            <p className="text-zinc-500 mt-2">Create and monitor strategic challenges for students.</p>
          </div>
          <button 
            onClick={() => setShowAddMissionModal(true)}
            className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Add New Mission
          </button>
        </header>

        <div className="grid gap-6">
          {cases.map((mission) => (
            <div key={mission.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{mission.title}</h3>
                <p className="text-zinc-500 text-sm mt-1">{mission.description}</p>
                <div className="flex gap-4 mt-4">
                  <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-400/10">
                    Reward: ${mission.reward}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest">
                    Deadline: {mission.deadline}
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${mission.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    {mission.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                  Edit
                </button>
                <button className="p-2 bg-zinc-800 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddMissionModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <h2 className="text-3xl font-bold text-white mb-6">Create New Mission</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Mission Title</label>
                  <input 
                    type="text" 
                    value={newMission.title}
                    onChange={(e) => setNewMission({...newMission, title: e.target.value})}
                    placeholder="e.g. Market Research Challenge"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    value={newMission.description}
                    onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                    placeholder="Describe the mission goals..."
                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all h-32 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Reward (YBD)</label>
                    <input 
                      type="number" 
                      value={newMission.reward}
                      onChange={(e) => setNewMission({...newMission, reward: parseInt(e.target.value)})}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Deadline Date</label>
                    <input 
                      type="date" 
                      value={newMission.deadline}
                      onChange={(e) => setNewMission({...newMission, deadline: e.target.value})}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowAddMissionModal(false)}
                    className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={createMission}
                    className="flex-1 py-4 bg-yellow-400 text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-yellow-400/20"
                  >
                    Create Mission
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
                {grades.length > 0 ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1) : '0.0'} <span className="text-xl text-zinc-600">%</span>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-green-400 transition-all duration-1000`} style={{ width: `${grades.length > 0 ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length) : 0}%` }} />
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">{grades.length > 0 ? 'Verified' : 'No Data'}</div>
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
                {cases.length.toString().padStart(2, '0')} <span className="text-xl text-zinc-600">Active</span>
              </div>
              <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-[2px] mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                {cases.length} Strategic Missions
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
                  {currentUser?.role === 'admin' ? 'Elite' : 'Member'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white tracking-tight">
                {currentUser?.role === 'admin' ? 'Premium' : 'Active'}
              </div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[2px] mt-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                {currentUser?.role === 'admin' ? 'Administrator' : 'Verified Member'}
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
                {cases
                  .filter(m => !transactions.some(t => t.mission_id === parseInt(m.id)))
                  .map((mission, idx) => (
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
                            onClick={() => awardYBD(mission.reward * 0.8, mission.title, mission.id)}
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

                <button 
                  onClick={() => setShowTransactionsModal(true)}
                  className="w-full mt-8 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-[2px] hover:text-white hover:border-zinc-600 transition-all"
                >
                  {t('viewFinancialHistory')}
                </button>
             </section>

             {/* Transactions Modal */}
             {showTransactionsModal && (
               <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                 <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[80vh]">
                   <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-bold text-white">Financial History</h2>
                     <button onClick={() => setShowTransactionsModal(false)} className="text-zinc-500 hover:text-white text-3xl">&times;</button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                     {transactions.map((tx, idx) => (
                       <div key={idx} className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                         <div>
                           <div className="font-bold text-white text-lg">{tx.reason}</div>
                           <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{tx.date} • {tx.createdBy}</div>
                         </div>
                         <div className={`text-xl font-bold tabular-nums ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {tx.amount > 0 ? '+' : ''}{tx.amount}
                         </div>
                       </div>
                     ))}
                     {transactions.length === 0 && (
                       <div className="text-center py-20 text-zinc-500">No transactions recorded yet.</div>
                     )}
                   </div>
                   
                   <button 
                     onClick={() => setShowTransactionsModal(false)}
                     className="mt-8 w-full py-4 bg-yellow-400 text-black font-bold rounded-2xl flex items-center justify-center gap-2"
                   >
                     Close History
                   </button>
                 </div>
               </div>
             )}
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
          <LoginPage />
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
            {currentPage === 'missions_admin' && renderMissionsAdmin()}
            {currentPage === 'students' && renderAdminStudents()}
            {currentPage !== 'dashboard' && currentPage !== 'missions_admin' && currentPage !== 'students' && (
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

  const renderAdminStudents = () => {
    return (
      <div className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2 uppercase tracking-tighter">Student Management</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Assign grades and track performance</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsers.filter(u => u.role === 'student').map(user => (
            <div key={user.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] hover:border-yellow-400/20 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-white uppercase overflow-hidden group-hover:border-yellow-400/40 transition-colors">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight uppercase group-hover:text-yellow-400 transition-colors">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest py-1 px-2 bg-zinc-800 rounded-md">Class {user.grade || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-800/30 rounded-2xl border border-white/5 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balance</span>
                  <span className="text-xl font-bold text-white tabular-nums">${user.balance}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSelectedUserForGrading(user);
                  setShowGradingModal(true);
                }}
                className="w-full py-4 bg-zinc-800 border border-zinc-700 rounded-2xl text-[10px] font-bold text-yellow-400 uppercase tracking-widest hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                Assign Grade <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Grading Modal */}
        {showGradingModal && selectedUserForGrading && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Assign Grade</h2>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">For Student: {selectedUserForGrading.name}</p>
                </div>
                <button onClick={() => setShowGradingModal(false)} className="text-zinc-600 hover:text-white transition-colors">&times;</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Subject</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mathematics"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-400 transition-all font-medium"
                    value={newGrade.subject}
                    onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Score (0-100)</label>
                  <input 
                    type="number" 
                    placeholder="Score percentage"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-400 transition-all font-medium"
                    value={newGrade.score || ''}
                    onChange={(e) => setNewGrade({ ...newGrade, score: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Comments</label>
                  <textarea 
                    placeholder="Enter teacher feedback..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-yellow-400 transition-all font-medium h-32 resize-none"
                    value={newGrade.comment}
                    onChange={(e) => setNewGrade({ ...newGrade, comment: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => setShowGradingModal(false)}
                  className="py-4 bg-transparent border border-zinc-800 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white hover:border-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitGrade}
                  className="py-4 bg-yellow-400 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-lg shadow-yellow-400/20"
                >
                  Confirm Grade
                </button>
              </div>
            </div>
          </div>
        )}
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
