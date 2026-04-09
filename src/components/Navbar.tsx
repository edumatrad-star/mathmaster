import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, BookOpen, Trophy, User, LogOut, Calendar, AppWindow, ShieldCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, profile } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lekcje', path: '/lessons', icon: BookOpen },
    { name: 'Aplikacje', path: '/applications', icon: AppWindow },
    { name: 'Plan Nauki', path: '/plan', icon: Calendar },
    { name: 'Ranking', path: '/leaderboard', icon: Trophy },
  ];

  if (profile?.role === 'parent') {
    navItems.push({ name: 'Panel Rodzica', path: '/parent', icon: User });
  }

  if (profile?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">MathMaster</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors",
                  location.pathname === item.path 
                    ? "text-indigo-600" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all">
                  <div className="w-6 h-6 rounded-full overflow-hidden">
                    <img src={profile?.avatar_url || user.user_metadata?.avatar_url || ''} alt="" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700">{profile?.isPremium ? 'PREMIUM' : 'FREE'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Wyloguj</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  Zaloguj się
                </Link>
                <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  Zacznij naukę
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
