import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Save, Loader2, Shield, GraduationCap, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
];

export default function ProfilePage() {
  const { user, profile, isMockMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    schoolClass: '',
    photoURL: ''
  });

  useEffect(() => {
    if (user && profile) {
      setFormData({
        displayName: profile.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        schoolClass: profile.schoolClass || '',
        photoURL: profile.photoURL || ''
      });
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isMockMode) {
      alert("Tryb Demo: Zmiany nie zostaną zapisane.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update Email
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: formData.email });
        if (emailError) throw emailError;
      }

      // Update Supabase users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          display_name: formData.displayName,
          school_class: formData.schoolClass,
          photo_url: formData.photoURL,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Wystąpił błąd podczas aktualizacji profilu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
      >
        <div className="bg-indigo-600 p-8 text-white relative">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center border-2 border-white/30 overflow-hidden shadow-xl">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <button 
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-2 -right-2 bg-white text-indigo-600 p-2 rounded-xl shadow-lg hover:scale-110 transition-transform"
              >
                <ImageIcon size={16} />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{formData.displayName || 'Użytkownik'}</h1>
              <p className="text-indigo-200 font-medium mt-1 uppercase tracking-widest text-sm">
                {profile?.role === 'admin' ? 'Administrator' : profile?.role === 'parent' ? 'Rodzic' : 'Uczeń'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl text-sm font-medium">
              Profil został pomyślnie zaktualizowany!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} />
                Imię i Nazwisko
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={14} />
                Adres E-mail
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={14} />
                Klasa / Kurs
              </label>
              <input
                type="text"
                value={formData.schoolClass}
                onChange={(e) => setFormData({ ...formData, schoolClass: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                placeholder="np. 8A"
              />
              <p className="text-[10px] text-slate-400 font-medium">Wpisz swoją klasę, aby widzieć przypisane do niej treści.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} />
                Status Konta
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 font-bold text-indigo-600 flex items-center justify-between">
                <span>{profile?.isPremium ? 'PREMIUM' : 'FREE'}</span>
                {!profile?.isPremium && (
                  <button type="button" className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-all">
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Zapisz Zmiany
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-3xl">
        <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
          <Shield size={16} />
          Bezpieczeństwo
        </h3>
        <p className="text-xs text-amber-700 leading-relaxed">
          Pamiętaj, że zmiana adresu e-mail może wymagać ponownej weryfikacji. Jeśli logujesz się przez Google, Twoje dane są synchronizowane z kontem Google.
        </p>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Wybierz swój awatar</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFormData({ ...formData, photoURL: avatar });
                    setShowAvatarModal(false);
                  }}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all hover:scale-105 ${formData.photoURL === avatar ? 'border-indigo-600 shadow-lg shadow-indigo-200' : 'border-transparent hover:border-indigo-200'}`}
                >
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover bg-slate-100" />
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
