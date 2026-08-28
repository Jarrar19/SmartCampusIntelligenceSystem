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
  const [prn, setPrn] = useState('');
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

      if (role === 'STUDENT' && !prn.trim()) {
        error('Please enter your official Roll No. / USN (e.g. CM23001).');
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
        prn: role === 'STUDENT' ? prn.trim().toUpperCase() : undefined,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200 bg-dot-pattern">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition cursor-pointer active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Hero Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-blue-600 to-emerald-600 text-white shadow-md shadow-orange-500/20 mb-3 border border-orange-400/30">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Smart Campus <span className="text-gradient-tricolor">Intelligence</span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold max-w-md mx-auto">
          {config?.collegeName || 'Student Digital Ecosystem & Academic Hub'}
        </p>

        {/* Feature Pills with Tricolor Accents */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-orange-500" /> Course LMS
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Verified @{collegeDomain}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> ₹0 Marketplace
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-card-hero p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          
          {/* Sign In vs Register Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 mb-5 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                isLogin
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                !isLogin
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Campus Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['STUDENT', 'FACULTY', 'HOD'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-xl text-[11px] font-bold transition cursor-pointer active:scale-95 ${
                          role === r
                            ? 'bg-brand-600 text-white shadow-xs border border-brand-500'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {r === 'STUDENT' ? 'Student' : r === 'HOD' ? 'HoD' : 'Faculty'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Academic Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full glass-input rounded-xl text-xs font-semibold px-3.5 py-2.5 focus:outline-none"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecom">Electronics & Telecom</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                </div>

                {role === 'STUDENT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Semester <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full glass-input rounded-xl text-xs font-semibold px-3.5 py-2.5 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Roll No. / USN"
                      placeholder="e.g. CM23001"
                      value={prn}
                      onChange={(e) => setPrn(e.target.value.toUpperCase())}
                      isRequired
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <Input
                label={isLogin ? "Institutional Email or Roll No. / USN" : "Institutional Email"}
                type="text"
                placeholder={isLogin ? `yourname@${collegeDomain} or CM23001` : `yourname@${collegeDomain}`}
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
              variant="tricolor"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isLogin ? 'Sign In to Campus' : 'Create Verified Account'}
            </Button>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-2">
              1-Click Institutional Demo Profiles
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student@sbjit.edu.in')}
                className="p-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 text-slate-800 dark:text-slate-200 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition text-center cursor-pointer active:scale-95 group shadow-2xs"
              >
                <User className="w-3.5 h-3.5 mx-auto mb-0.5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-extrabold block">Raj (Student)</span>
                <span className="text-[9px] text-orange-700/80 dark:text-orange-400/80 block">USN: CM23001</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student2@sbjit.edu.in')}
                className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-center cursor-pointer active:scale-95 group shadow-2xs"
              >
                <User className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-extrabold block">Chaitanya (Student)</span>
                <span className="text-[9px] text-blue-700/80 dark:text-blue-400/80 block">USN: CM23002</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('faculty@sbjit.edu.in')}
                className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition text-center cursor-pointer active:scale-95 group shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 mx-auto mb-0.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-extrabold block">Faculty Portal</span>
                <span className="text-[9px] text-emerald-700/80 dark:text-emerald-400/80 block">Prof. Jenkins</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('hod@sbjit.edu.in')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center cursor-pointer active:scale-95 group shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-700 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-extrabold block">HoD Portal</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block">Publish Results</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
