'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
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
import { staffCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { AddStaffModal } from './components/AddStaffModal';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

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

  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const pageRef = usePageGSAP();
  const listRef = useGSAPList<HTMLTableSectionElement>([]);

  type StaffFormValues = z.infer<typeof staffCreateSchema>;
  
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (!pharmacyId) return;
    fetchData();

    const channel = supabase
      .channel('staff-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pharmacyId]);

  const fetchData = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const [sessionsRes, activeRes, staffData] = await Promise.all([
        supabase.from('sessions').select('*').eq('pharmacy_id', pharmacyId).order('start_time', { ascending: false }).limit(10),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('pharmacy_id', pharmacyId).eq('status', 'active'),
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

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredStaff,
    { pageSize: PAGE_SIZE }
  );

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (data) setCurrentUserProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  const isAdmin = currentUserProfile?.role === 'admin';

  return (

    <div ref={pageRef} className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 pb-12">
      <header data-gsap="fade-up" className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 font-cairo">
             <UsersIcon className="text-[#00CED1] w-10 h-10" />
             إدارة <span className="nile-gradient-text">فريق العمل</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo text-lg">إدارة صلاحيات الموظفين، تتبع النشاط، وإضافة حسابات جديدة.</p>
        </div>
        {isAdmin && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="nile-button-primary flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold shadow-[0_0_20px_rgba(0,206,209,0.3)] font-cairo"
          >
            <UserPlus className="w-6 h-6" /> إضافة موظف جديد
          </motion.button>
        )}
      </header>

      {/* Stats Cards - Only for Admin */}
      {isAdmin && (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff Table Section */}
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
                    <th className="p-6 whitespace-nowrap font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الموظف</th>
                    <th className="p-6 whitespace-nowrap font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الدور</th>
                    <th className="p-6 whitespace-nowrap font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الراتب</th>
                    <th className="p-6 whitespace-nowrap font-bold text-gray-400 text-right uppercase tracking-wider text-xs">الحوافز</th>
                    <th className="p-6 whitespace-nowrap font-bold text-gray-400 text-center uppercase tracking-wider text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody ref={listRef} className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#00CED1]" /></td></tr>
                  ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-500 font-cairo text-lg">لا يوجد موظفين بهذا الاسم</td></tr>
                  ) : (
                    paginatedData.map((staff, i) => (
                      <tr 
                        key={staff.id} 
                        className="group hover:bg-white/[0.02] transition-all cursor-default"
                      >
                        <td className="p-6 whitespace-nowrap">
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
                        <td className="p-6 whitespace-nowrap">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border font-cairo flex items-center w-fit gap-2 ${
                             staff.role === 'admin' 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                           }`}>
                              <Shield className="w-3 h-3" />
                              {staff.role === 'admin' ? 'مدير نظام' : 'موظف'}
                           </span>
                        </td>
                        <td className="p-6 text-white font-bold font-inter">
                          {staff.salary?.toLocaleString()} ج.م
                        </td>
                        <td className="p-6 text-green-400 font-bold font-inter">
                          +{staff.incentives?.toLocaleString()} ج.م
                        </td>
                        <td className="p-6 whitespace-nowrap">
                           <div className="flex items-center justify-center gap-2">
                             {isAdmin && (
                               <>
                                 <button className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5" title="تعديل">
                                    <Shield className="w-4 h-4" />
                                 </button>
                                 <button className="p-2.5 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/10" title="حذف">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                               </>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          )}
        </div>

        {/* Recent Sessions */}
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

      {/* Add Staff Modal */}
      <AnimatePresence>
        <AddStaffModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onAddStaff={onSubmit} 
          addLoading={addLoading} 
        />
      </AnimatePresence>
    </div>
  );
}
