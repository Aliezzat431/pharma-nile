'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Loader2, Clock, User as UserIcon } from 'lucide-react';
import { getCurrentActiveSession, startShift, endShift, Session } from '@/lib/api/sessions';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShiftControl() {
  const { user, refreshShift } = useAuth() as any;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSession();
    }
  }, [user]);

  const fetchSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await getCurrentActiveSession(user.id);
      setSession(s);
    } catch (err) {
      console.error("Session fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const shiftType = new Date().getHours() < 16 ? 'morning' : 'night';
      const newSession = await startShift(user.id, user.user_metadata?.full_name || 'Staff', shiftType);
      await refreshShift();
      setSession(newSession);
    } catch (err: any) {
      console.error("Start Shift Error Details:", err);
      alert(`عذراً، فشل بدء الوردية: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      await endShift(session.id);
      await refreshShift();
      setSession(null);
    } catch (err: any) {
      console.error("End Shift Error Details:", err);
      alert(`عذراً، فشل إنهاء الوردية: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="h-20 glass-card animate-pulse"></div>;

  return (
    <div className="glass-panel p-6 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5">
         <Clock className="w-20 h-20" />
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${session ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg font-cairo">
              {session ? `أنت الآن في وردية: ${session.shift_type === 'morning' ? 'صباحية' : 'مسائية'}` : 'لم تبدأ الوردية بعد'}
            </h3>
            <p className="text-sm text-gray-400 font-cairo">
              {session ? `بدأت في: ${new Date(session.start_time).toLocaleTimeString()}` : 'يرجى فتح وردية لبدء عمليات البيع'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!session ? (
            <motion.button
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleStartShift}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00CED1] text-white font-bold hover:shadow-[0_0_15px_rgba(0,206,209,0.4)] transition-all disabled:opacity-50 font-cairo"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              بدء الوردية الآن
            </motion.button>
          ) : (
            <motion.button
              key="end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={handleEndShift}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 font-cairo"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
              إغلاق الوردية الحالية
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

