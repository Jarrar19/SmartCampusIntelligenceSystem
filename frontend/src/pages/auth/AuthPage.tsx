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
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 bg-dot-pattern">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 shadow-lg backdrop-blur-xl transition cursor-pointer active:scale-95 hover:bg-white/60 dark:hover:bg-slate-800/60"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Vibrant Ambient Glass Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute top-[10%] left-[20%] w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-pink-500/20 rounded-full blur-[140px] animate-float-glow" />
        <div className="absolute bottom-[10%] right-[15%] w-[600px] h-[600px] bg-gradient-to-br from-sky-500/25 via-indigo-600/30 to-emerald-500/20 rounded-full blur-[150px] animate-float-glow-reverse" />
        <div className="absolute top-[45%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-amber-500/15 rounded-full blur-[120px] animate-float-glow" />
      </div>

      {/* Hero Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 mb-4 border border-white/40 animate-pulse-subtle">
          <GraduationCap className="w-11 h-11" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          Smart Campus <span className="text-gradient">Intelligence</span>
        </h1>
        <p className="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300 font-extrabold max-w-md mx-auto">
          {config?.collegeName || 'Student Digital Ecosystem & Academic Hub'}
        </p>

        {/* Feature Pills with Glass Styling */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl text-indigo-700 dark:text-indigo-300 border border-white/60 dark:border-white/15 shadow-sm">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Course LMS
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl text-emerald-700 dark:text-emerald-300 border border-white/60 dark:border-white/15 shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> ₹0 Marketplace
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl text-purple-700 dark:text-purple-300 border border-white/60 dark:border-white/15 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Verified Institutional Domain
          </span>
        </div>
      </div>

      {/* Main Glass Card Form Container */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-card-hero p-6 sm:p-8 rounded-3xl border border-white/70 dark:border-white/15 shadow-2xl backdrop-blur-2xl">
          
          {/* Sign In vs Register Switcher */}
          <div className="flex rounded-2xl bg-white/30 dark:bg-slate-900/40 p-1 mb-6 border border-white/40 dark:border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                isLogin
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                !isLogin
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input
                  label="Full Name"
                  placeholder="e.g. Rajur Kude"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  isRequired
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    Campus Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['STUDENT', 'FACULTY'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer active:scale-95 ${
                          role === r
                            ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm border border-indigo-400/30'
                            : 'bg-white/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-white/50 dark:border-white/10'
                        }`}
                      >
                        {r === 'STUDENT' ? 'Student' : 'Faculty Member'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    Academic Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full glass-input rounded-2xl text-xs font-bold px-3.5 py-2.5 focus:outline-none"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecom">Electronics & Telecom</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>

                {role === 'STUDENT' && (
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                      Semester <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full glass-input rounded-2xl text-xs font-bold px-3.5 py-2.5 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <Input
                label="Institutional Email"
                type="email"
                placeholder={`yourname@${collegeDomain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                isRequired
              />
              {!isLogin && email && (
                <div className="mt-1 flex items-center gap-1.5">
                  {isDomainValid ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid @{collegeDomain} domain
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Must end with @{collegeDomain}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                isRequired
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isLogin ? 'Sign In to Campus' : 'Create Verified Account'}
            </Button>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-6 pt-5 border-t border-white/50 dark:border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-2.5">
              1-Click Institutional Demo Profiles
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rajurkude.aiml23@sbjit.edu.in')}
                className="p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-center cursor-pointer active:scale-95 group backdrop-blur-md shadow-xs"
              >
                <User className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black block">Raj (Student)</span>
                <span className="text-[9px] opacity-75 block">PRN: CM23001</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('bhushanmanjrekar@sbjit.edu.in')}
                className="p-2 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition text-center cursor-pointer active:scale-95 group backdrop-blur-md shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black block">Prof. Bhushan</span>
                <span className="text-[9px] opacity-75 block">Deep Learning</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sujatasardare@sbjit.edu.in')}
                className="p-2 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-800/60 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600 hover:text-white transition text-center cursor-pointer active:scale-95 group backdrop-blur-md shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black block">Prof. Sujata</span>
                <span className="text-[9px] opacity-75 block">Vision & Lab</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@sbjit.edu.in')}
                className="p-2 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition text-center cursor-pointer active:scale-95 group backdrop-blur-md shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black block">Admin Portal</span>
                <span className="text-[9px] opacity-75 block">Dean Academics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
