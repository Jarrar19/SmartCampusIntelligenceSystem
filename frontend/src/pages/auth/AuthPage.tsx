import React, { useState } from 'react';
import { 
  GraduationCap, Lock, Mail, User, BookOpen, 
  ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Sun, Moon,
  Eye, EyeOff, ShoppingBag, MessageSquare, ShieldAlert, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

export const AuthPage: React.FC = () => {
  const { login, register, config } = useAuth();
  const { success, error } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [semester, setSemester] = useState<number>(6);
  const [isLoading, setIsLoading] = useState(false);

  const collegeDomain = config?.collegeEmailDomain || 'sbjit.edu.in';
  const isDomainValid = email.toLowerCase().endsWith(`@${collegeDomain}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      await login(email.trim(), password);
    } else {
      if (!isDomainValid) {
        error(`Only institutional emails (@${collegeDomain}) are permitted.`);
        setIsLoading(false);
        return;
      }

      await register({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        role,
        department,
        semester: role === 'STUDENT' ? semester : undefined,
      });
    }

    setIsLoading(false);
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setEmail(demoEmail);
    setPassword('Password@123');
    await login(demoEmail, 'Password@123');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#030712] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 shadow-xs transition backdrop-blur-md cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-600/15 to-indigo-600/15 rounded-full blur-[150px] pointer-events-none animate-float-glow" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-indigo-500 text-white shadow-2xl shadow-brand-500/35 mb-3.5 border border-indigo-300/30">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Smart Campus
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold max-w-sm mx-auto">
          {config?.collegeName || 'Student Intelligence & Academic Hub'}
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
            <BookOpen className="w-3 h-3" /> Course LMS
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
            <ShoppingBag className="w-3 h-3" /> ₹0 Marketplace
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
            <ShieldCheck className="w-3 h-3" /> @{collegeDomain} Verified
          </span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90">
          {/* Quick Demo Fillers */}
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 dark:from-slate-800/70 dark:to-slate-900/80 border border-indigo-100 dark:border-slate-700/60 shadow-2xs">
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Persona Access</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Demo Mode</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(`faculty1@${collegeDomain}`)}
                className="p-2.5 rounded-2xl text-left bg-white dark:bg-indigo-500/15 hover:bg-indigo-50 dark:hover:bg-indigo-500/25 border border-indigo-200 dark:border-indigo-500/30 transition text-xs shadow-2xs cursor-pointer flex flex-col group active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    P
                  </div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300 group-hover:text-brand-600 truncate">
                    Prof. Jenkins
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-8">Faculty (CSE)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(`student1@${collegeDomain}`)}
                className="p-2.5 rounded-2xl text-left bg-white dark:bg-emerald-500/15 hover:bg-emerald-50 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/30 transition text-xs shadow-2xs cursor-pointer flex flex-col group active:scale-95"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                    A
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 truncate">
                    Alex Rivera
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-8">Student (6th Sem)</span>
              </button>
            </div>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                isLogin 
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                !isLogin 
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full glass-input rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty Member</option>
                    </select>
                  </div>

                  {role === 'STUDENT' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full glass-input rounded-2xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Electronics & Communication Engineering">ECE</option>
                        <option value="Electrical Engineering">EE</option>
                        <option value="Mechanical Engineering">ME</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  College Email Address *
                </label>
                {email && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${isDomainValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {isDomainValid ? <Check className="w-3 h-3" /> : 'Invalid Domain'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`username@${collegeDomain}`}
                  className="w-full glass-input rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Restricted to institutional domain <code className="text-brand-600 dark:text-brand-400 font-mono font-bold">@{collegeDomain}</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input rounded-2xl pl-10 pr-10 py-2.5 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 hover:from-brand-500 hover:to-indigo-600 transition shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <span>{isLoading ? 'Authenticating...' : isLogin ? 'Sign In to Campus Hub' : 'Register Verified Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
