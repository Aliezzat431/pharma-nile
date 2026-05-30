'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users as UsersIcon, Plus, UserCheck, Search, Filter, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Session {
  id: string;
  username: string;
  start_time: string;
  end_time: string | null;
  shift_type: string;
  status: string;
}

export default function StaffManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [sessionsRes, activeRes, totalRes] = await Promise.all([
      supabase.from('sessions').select('*').order('start_time', { ascending: false }).limit(20),
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true })
    ]);

    setSessions(sessionsRes.data || []);
    setActiveCount(activeRes.count || 0);
    setTotalStaff(totalRes.count || 0);
    setLoading(false);
  };

  const currentShiftType = new Date().getHours() < 16 ? 'Morning' : 'Evening';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
             <UsersIcon className="text-[#00CED1]" />
             إدارة <span className="nile-gradient-text">الموظفين</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">إدارة شؤون الموظفين، تتبع الورديات، والرواتب.</p>
        </div>
      
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 flex flex-col gap-2">
             <div className="flex justify-between font-cairo">
                 <h3 className="text-gray-400 font-medium">نشط الآن</h3>
                 <UserCheck className="w-5 h-5 text-green-400" />
             </div>
             <p className="text-4xl font-bold">{activeCount}</p>
          </div>
          <div className="glass-card p-6 flex flex-col gap-2 border-[#00CED1]/30 neon-glow-teal">
             <div className="flex justify-between font-cairo">
                 <h3 className="text-gray-400 font-medium">الوردية الحالية</h3>
                 <Clock className="w-5 h-5 text-[#00CED1]" />
             </div>
             <p className="text-4xl font-bold font-cairo">{currentShiftType === 'Morning' ? 'صباحية' : 'مسائية'}</p>
          </div>
          <div className="glass-card p-6 flex flex-col gap-2">
             <div className="flex justify-between font-cairo">
                 <h3 className="text-gray-400 font-medium">إجمالي الموظفين</h3>
                 <UsersIcon className="w-5 h-5 text-[#D4AF37]" />
             </div>
             <p className="text-4xl font-bold">{totalStaff}</p>
          </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="بحث عن موظف..." 
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-2 font-cairo"
          />
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-panel overflow-hidden">
        <h2 className="text-xl font-bold p-6 border-b border-white/10 font-cairo text-right">الورديات والنشاطات الأخيرة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 font-cairo">
                <th className="p-5 font-semibold text-gray-300 text-right">اسم الموظف</th>
                <th className="p-5 font-semibold text-gray-300 text-right">نوع الوردية</th>
                <th className="p-5 font-semibold text-gray-300 text-right">تسجيل الدخول</th>
                <th className="p-5 font-semibold text-gray-300 text-right">تسجيل الخروج</th>
                <th className="p-5 font-semibold text-gray-300 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={5} className="p-10 text-center text-gray-500 font-cairo">جاري التحميل...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-10 text-center text-gray-500 font-cairo">لا توجد ورديات مسجلة مؤخراً.</td>
                </tr>
              ) : (
                sessions.map((session, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={session.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-5 font-medium text-white">{session.username}</td>
                    <td className="p-5 text-gray-400 capitalize font-cairo">{session.shift_type === 'Morning' ? 'صباحية' : 'مسائية'}</td>
                    <td className="p-5 text-gray-400">
                      {new Date(session.start_time).toLocaleTimeString()}
                    </td>
                    <td className="p-5 text-gray-400">
                      {session.end_time ? new Date(session.end_time).toLocaleTimeString() : '-'}
                    </td>
                    <td className="p-5">
                       <span className={`px-2 py-1 rounded text-xs font-bold border font-cairo ${
                         session.status === 'active' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                       }`}>
                          {session.status === 'active' ? 'نشط' : 'مغلق'}
                       </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
