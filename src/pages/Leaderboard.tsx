import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, User, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../firebase';

interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  streak: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'public_profiles'),
      orderBy('totalPoints', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="pt-32 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
          <Trophy className="text-yellow-500" size={40} />
          Ranking Mistrzów
        </h1>
        <p className="text-slate-500">Najlepsi uczniowie MathMaster w tym miesiącu.</p>
      </header>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-12 items-end">
        {/* 2nd Place */}
        {users[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm"
          >
            <div className="relative inline-block mb-4">
              <img src={users[1].photoURL} alt="" className="w-16 h-16 rounded-full border-4 border-slate-100" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-white border-2 border-white">
                <Medal size={16} />
              </div>
            </div>
            <div className="font-bold text-slate-900 truncate">{users[1].displayName}</div>
            <div className="text-indigo-600 font-bold text-sm">{users[1].totalPoints} pkt</div>
          </motion.div>
        )}

        {/* 1st Place */}
        {users[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-indigo-600 p-8 rounded-3xl text-center shadow-xl shadow-indigo-200 transform scale-110 z-10"
          >
            <div className="relative inline-block mb-4">
              <img src={users[0].photoURL} alt="" className="w-20 h-20 rounded-full border-4 border-indigo-400" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                <Crown size={32} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                <Trophy size={20} />
              </div>
            </div>
            <div className="font-bold text-white truncate">{users[0].displayName}</div>
            <div className="text-indigo-100 font-bold">{users[0].totalPoints} pkt</div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {users[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-sm"
          >
            <div className="relative inline-block mb-4">
              <img src={users[2].photoURL} alt="" className="w-16 h-16 rounded-full border-4 border-slate-100" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white border-2 border-white">
                <Medal size={16} />
              </div>
            </div>
            <div className="font-bold text-slate-900 truncate">{users[2].displayName}</div>
            <div className="text-indigo-600 font-bold text-sm">{users[2].totalPoints} pkt</div>
          </motion.div>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {users.slice(3).map((user, index) => (
          <div 
            key={user.uid}
            className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 text-center font-bold text-slate-400">{index + 4}</span>
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold text-slate-900">{user.displayName}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  🔥 {user.streak} dni z rzędu
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-indigo-600">{user.totalPoints} pkt</div>
                <div className="text-[10px] text-green-500 flex items-center justify-end gap-1">
                  <ArrowUp size={10} />
                  3 miejsca
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
