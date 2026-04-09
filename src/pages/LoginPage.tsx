import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, LogIn, ShieldCheck, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const { login, loginWithEmail, loginAsAdmin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials') || err.status === 400) {
        setError('Błędny email lub hasło');
      } else if (err.message?.includes('User not found')) {
        setError('Użytkownik nie istnieje');
      } else {
        setError(err.message || 'Wystąpił błąd podczas logowania');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (adminUsername === 'admin') {
      const success = await loginAsAdmin(adminPassword);
      if (success) {
        navigate('/admin');
      } else {
        setError('Błędne hasło');
      }
    } else {
      setError('Błędna nazwa użytkownika');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Witaj w MathMaster</h1>
          <p className="text-slate-500 mt-2">Zaloguj się, aby kontynuować naukę</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!showAdminLogin && !showEmailLogin ? (
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-5 h-5" />
              Zaloguj się przez Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">lub</span>
              </div>
            </div>

            <button
              onClick={() => setShowEmailLogin(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <LogIn size={20} />
              Zaloguj się (Email / Nick)
            </button>
            
            <button
              onClick={() => setShowAdminLogin(true)}
              className="w-full py-3 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              Logowanie Administratora
            </button>
          </div>
        ) : showEmailLogin ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-4 text-sm">
              <LogIn size={18} className="text-indigo-600" />
              Logowanie
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email lub nazwa użytkownika</label>
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="twoj@email.pl lub adam_nowak"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hasło</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailLogin(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Powrót
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 text-sm">
              <ShieldCheck size={18} />
              Logowanie Admina
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Użytkownik</label>
              <input
                type="text"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="admin"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hasło</label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Powrót
              </button>
              <button
                type="submit"
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Zaloguj
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-100 text-center space-y-4">
          <Link 
            to="/register" 
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            Nie masz konta? Zarejestruj się za darmo
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Logując się, akceptujesz nasz Regulamin oraz Politykę Prywatności.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
