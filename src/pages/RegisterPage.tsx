import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, UserPlus, AlertCircle, ArrowLeft, Mail, Lock, User, Check, X, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';

const LEVELS = [
  { id: '4sp', label: 'Klasa 4 SP' },
  { id: '5sp', label: 'Klasa 5 SP' },
  { id: '6sp', label: 'Klasa 6 SP' },
  { id: '7sp', label: 'Klasa 7 SP' },
  { id: '8sp', label: 'Klasa 8 SP' },
  { id: 'egzamin_8', label: 'Egzamin ósmoklasisty' },
  { id: '1pp', label: '1 Klasa Ponadpodstawowa' },
  { id: '2pp', label: '2 Klasa Ponadpodstawowa' },
  { id: '3pp', label: '3 Klasa Ponadpodstawowa' },
  { id: '4pp', label: '4 Klasa Ponadpodstawowa' },
  { id: '5pp', label: '5 Klasa Ponadpodstawowa' },
  { id: 'matura', label: 'Matura' },
];

export default function RegisterPage() {
  const { register, user, loading, checkUsernameAvailability, suggestUsernames } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced username check
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setUsernameStatus('checking');
        try {
          const isAvailable = await checkUsernameAvailability(username);
          if (isMounted) {
            if (isAvailable) {
              setUsernameStatus('available');
              setSuggestions([]);
            } else {
              setUsernameStatus('taken');
              const newSuggestions = await suggestUsernames(username);
              setSuggestions(newSuggestions);
            }
          }
        } catch (err) {
          console.error("Error checking username:", err);
          if (isMounted) setUsernameStatus('idle');
        }
      } else {
        setUsernameStatus('idle');
        setSuggestions([]);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [username, checkUsernameAvailability, suggestUsernames, refreshKey]);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const toggleLevel = (id: string) => {
    setSelectedLevels(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameStatus !== 'available') {
      setError('Proszę wybrać dostępną nazwę użytkownika');
      return;
    }

    if (selectedLevels.length === 0) {
      setError('Proszę wybrać co najmniej jeden poziom nauczania');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, displayName, username, selectedLevels);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ten adres email jest już zajęty');
      } else if (err.code === 'auth/invalid-email') {
        setError('Niepoprawny format adresu email');
      } else if (err.code === 'auth/weak-password') {
        setError('Hasło jest zbyt słabe');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Rejestracja e-mail jest obecnie wyłączona w konsoli Supabase. Włącz ją w sekcji Authentication > Providers.');
      } else {
        setError('Wystąpił błąd podczas rejestracji: ' + (err.message || 'Nieznany błąd'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dołącz do MathMaster</h1>
          <p className="text-slate-500 mt-2">Stwórz konto rodzica i zacznijcie naukę</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Imię / Nick</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Twoje imię"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nazwa użytkownika (unikalna)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border outline-none transition-all ${
                    usernameStatus === 'available' ? 'border-emerald-200 focus:ring-emerald-500 bg-emerald-50/10' : 
                    usernameStatus === 'taken' ? 'border-rose-200 focus:ring-rose-500 bg-rose-50/10' : 
                    'border-slate-200 focus:ring-indigo-500'
                  }`}
                  placeholder="uzytkownik123"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="animate-spin text-slate-400" size={18} />}
                  {usernameStatus === 'available' && <Check className="text-emerald-500" size={18} />}
                  {usernameStatus === 'taken' && <X className="text-rose-500" size={18} />}
                  {usernameStatus === 'idle' && username.length >= 3 && <AlertCircle className="text-amber-500" size={18} />}
                </div>
              </div>
              {usernameStatus === 'idle' && username.length >= 3 && (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-amber-600 font-bold">Nie udało się sprawdzić dostępności.</p>
                  <button 
                    type="button" 
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    Ponów
                  </button>
                </div>
              )}
              {usernameStatus === 'taken' && suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-rose-500 font-bold uppercase mb-1">Propozycje:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUsername(s)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Wybierz poziomy nauczania (możesz wybrać kilka)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEVELS.map(level => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => toggleLevel(level.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedLevels.includes(level.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="twoj@email.pl"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Potwierdź Hasło</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                  placeholder="••••••"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">Hasła nie są identyczne</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || usernameStatus !== 'available' || (confirmPassword !== '' && password !== confirmPassword)}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Tworzenie konta...' : (
              <>
                <UserPlus size={20} />
                Zarejestruj się jako Rodzic
              </>
            )}
          </button>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Masz już konto? Zaloguj się
          </Link>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Rejestrując się, akceptujesz nasz Regulamin oraz Politykę Prywatności.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
