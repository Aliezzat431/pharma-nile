'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users as UsersIcon, 
  Plus, 
  UserCheck, 
  Search, 
  Clock, 
  Trash2, 
  Shield, 
  Mail,
  Loader2,
  X,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllStaff, UserProfile } from '@/lib/api/staff';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  username: string;
  start_time: string;
  end_time: string | null;
  shift_type: string;
  status: string;
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  type StaffFormValues = z.infer<typeof staffCreateSchema>;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StaffFormValues>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: { email: '', password: '', full_name: '', role: 'staff' }
  });
  
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('staff-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, activeRes, staffData] = await Promise.all([
        supabase.from('sessions').select('*').order('start_time', { ascending: false }).limit(10),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        getAllStaff()
      ]);

      setSessions(sessionsRes.data || []);
      setActiveCount(activeRes.count || 0);
      setStaffList(staffData || []);
    } catch (err) {
      console.error("Fetch data error", err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StaffFormValues) => {
    setAddLoading(true);
    try {
      const res = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create staff');

      setIsAddModalOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold flex items-center gap-3 font-cairo"
          >
             <UsersIcon className="text-[#00CED1] w-10 h-10" />
             إدارة <span className="nile-gradient-text">طاقم العمل</span>
          </motion.h1>
          <p className="text-gray-400 mt-2 font-cairo text-lg">إدارة صلاحيات الموظفين، تتبع النشاط، وإضافة حسابات جديدة.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddModalOpen(true)}
          className="nile-button-primary flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(0,206,209,0.3)] font-cairo"
        >
          <UserPlus className="w-6 h-6" /> إضافة موظف جديد
        </motion.button>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 flex flex-col gap-4 border-white/5 relative overflow-hidden group">
             <div className="flex justify-between items-center z-10">
                 <h3 className="text-gray-400 font-bold font-cairo text-sm uppercase tracking-widest">الموظفين النشطين</h3>
                 <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                    <UserCheck className="w-6 h-6" />
                 </div>
             </div>
             <p className="text-5xl font-bold z-10">{activeCount}</p>
             <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8 flex flex-col gap-4 border-[#00CED1]/20 neon-glow-teal relative overflow-hidden group">
             <div className="flex justify-between items-center z-10">
                 <h3 className="text-gray-400 font-bold font-cairo text-sm uppercase tracking-widest">إجمالي الفريق</h3>
                 <div className="p-3 bg-[#00CED1]/10 rounded-xl text-[#00CED1]">
                    <UsersIcon className="w-6 h-6" />
                 </div>
             </div>
             <p className="text-5xl font-bold z-10">{staffList.length}</p>
             <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#00CED1]/5 rounded-full blur-3xl group-hover:bg-[#00CED1]/10 transition-all" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-8 flex flex-col gap-4 border-white/5 relative overflow-hidden group">
             <div className="flex justify-between items-center z-10">
                 <h3 className="text-gray-400 font-bold font-cairo text-sm uppercase tracking-widest">آخر نشاط</h3>
                 <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <Clock className="w-6 h-6" />
                 </div>
             </div>
             <p className="text-xl font-bold z-10 font-cairo">
                {sessions[0] ? new Date(sessions[0].start_time).toLocaleTimeString('ar-EG') : 'لا يوجد'}
             </p>
             <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
          </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 glass-panel p-1 flex items-center gap-3 group focus-within:border-[#00CED1]/50 transition-all">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input 
                type="text" 
                placeholder="بحث باسم الموظف أو الدور الوظيفي..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-3 font-cairo font-medium"
              />
            </div>
          </div>

          <div className="glass-panel overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-cairo">
                    <th className="p-6 font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الموظف</th>
                    <th className="p-6 font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الدور</th>
                    <th className="p-6 font-bold text-gray-400 text-right uppercase tracking-wider text-xs">تاريخ الانضمام</th>
                    <th className="p-6 font-bold text-gray-400 text-center uppercase tracking-wider text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#00CED1]" /></td></tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-gray-500 font-cairo text-lg">لا يوجد موظفين بهذا الاسم</td></tr>
                  ) : (
                    filteredStaff.map((staff, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={staff.id} 
                        className="group hover:bg-white/[0.02] transition-all cursor-default"
                      >
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00CED1]/20 to-[#D4AF37]/20 flex items-center justify-center font-bold text-[#00CED1] border border-white/10 group-hover:scale-110 transition-transform">
                                 {staff.full_name?.substring(0, 2) || 'ST'}
                              </div>
                              <div>
                                <p className="font-bold text-white font-cairo group-hover:text-[#00CED1] transition-colors">{staff.full_name}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-tighter">ID: {staff.id.slice(0, 8)}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border font-cairo flex items-center w-fit gap-2 ${
                             staff.role === 'admin' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                           }`}>
                              <Shield className="w-3 h-3" />
                              {staff.role === 'admin' ? 'مدير نظام' : 'موظف'}
                           </span>
                        </td>
                        <td className="p-6 text-gray-400 font-medium">
                          {new Date(staff.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-6">
                           <div className="flex items-center justify-center gap-2">
                             <button className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5" title="تعديل">
                                <Shield className="w-4 h-4" />
                             </button>
                             <button className="p-2.5 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/10" title="حذف">
                                <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-cairo flex items-center gap-3 px-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            أحدث النشاطات
          </h2>
          <div className="glass-panel p-6 space-y-5 border-white/5">
            {sessions.length > 0 ? (
              sessions.map((session, i) => (
                <div key={session.id} className="relative pr-6 border-r border-white/10 space-y-1">
                  <div className={`absolute top-0 right-[-5px] w-[10px] h-[10px] rounded-full ${session.status === 'active' ? 'bg-[#00CED1] shadow-[0_0_10px_#00CED1]' : 'bg-gray-600'}`} />
                  <p className="text-sm font-bold text-white font-cairo">{session.username}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    {session.shift_type === 'Morning' ? 'صباحية' : 'مسائية'} • {new Date(session.start_time).toLocaleTimeString('ar-EG')}
                  </p>
                  {session.status === 'active' && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#00CED1]/10 text-[#00CED1] text-[10px] font-bold">نشط الآن</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-10 font-cairo">لا يوجد نشاط مسجل</p>
            )}
            <button className="w-full py-4 rounded-xl bg-white/5 text-gray-400 font-bold text-xs hover:bg-white/10 transition-all font-cairo border border-dashed border-white/10">
              عرض كل سجلات الدخول
            </button>
          </div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-xl p-8 z-10 border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#00CED1]/10 rounded-2xl text-[#00CED1]">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-cairo">موظف جديد</h2>
                    <p className="text-gray-400 text-sm font-cairo">أنشئ حساباً جديداً لأحد أفراد العمل</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo">الاسم الكامل</label>
                    <div className={cn("glass-panel p-3 flex items-center gap-3", errors.full_name && "border-red-500/50")}>
                      <UsersIcon className="w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        {...register("full_name")}
                        className="flex-1 bg-transparent border-none outline-none font-cairo"
                        placeholder="أدخل الاسم الرباعي..."
                      />
                    </div>
                    {errors.full_name && <p className="text-red-400 text-xs font-cairo">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo">البريد الإلكتروني</label>
                    <div className={cn("glass-panel p-3 flex items-center gap-3", errors.email && "border-red-500/50")}>
                      <Mail className="w-4 h-4 text-gray-500" />
                      <input 
                        type="email" 
                        {...register("email")}
                        className="flex-1 bg-transparent border-none outline-none font-inter"
                        placeholder="staff@pharmanile.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs font-cairo">{errors.email.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo">كلمة المرور</label>
                      <div className={cn("glass-panel p-3", errors.password && "border-red-500/50")}>
                        <input 
                          type="password" 
                          {...register("password")}
                          className="w-full bg-transparent border-none outline-none font-inter"
                          placeholder="••••••••"
                        />
                      </div>
                      {errors.password && <p className="text-red-400 text-xs font-cairo">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1 font-cairo">الصلاحيات</label>
                      <div className="glass-panel p-3">
                        <select 
                          {...register("role")}
                          className="w-full bg-transparent border-none outline-none font-cairo text-sm"
                        >
                          <option value="staff" className="bg-[#111]">موظف صيدلية</option>
                          <option value="admin" className="bg-[#111]">مدير نظام</option>
                        </select>
                      </div>
                      {errors.role && <p className="text-red-400 text-xs font-cairo">{errors.role.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border border-white/5 font-bold font-cairo hover:bg-white/5 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-[2] py-4 rounded-2xl bg-[#00CED1] text-black font-bold font-cairo shadow-[0_0_20px_rgba(0,206,209,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    إنشاء الحساب الآن
                  </button>
                </div>
              </form>
              
              {}
              <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#00CED1]/10 rounded-full blur-[80px] -z-10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

