'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Loader2, Calendar, User, Activity, ArrowRight, Download, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuditLogs, AuditLog } from '@/lib/api/audit';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else {

        setIsAdmin(true); 
        fetchLogs();
      }
    }
  }, [user, authLoading]);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(l => 
    l.username.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target_type.toLowerCase().includes(search.toLowerCase())
  );

  const PAGE_SIZE = 15;
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredLogs,
    { pageSize: PAGE_SIZE }
  );

  if (authLoading || isAdmin === null) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
              سجلات <span className="text-red-500">النظام</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm font-cairo">لمراقبة كافة العمليات الحساسة التي تتم في الصيدلية.</p>
          </div>
        </div>
        <button className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors font-cairo">
          <Download className="w-4 h-4" /> تحميل نسخة كاملة
        </button>
      </header>

      {}
      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex gap-3">
         <AlertTriangle className="text-yellow-500 w-5 h-5 shrink-0" />
         <p className="text-sm text-yellow-200/70 font-cairo">هذه الصفحة مخصصة للمسؤولين فقط. يتم تسجيل كافة عمليات الدخول والاطلاع على هذه السجلات.</p>
      </div>

      {}
      <div className="glass-panel p-2 flex items-center gap-3">
        <div className="pl-3 text-gray-500">
           <Search className="w-5 h-5" />
        </div>
        <input 
          type="text" 
          placeholder="ابحث بالموظف، العملية، أو نوع البيانات..." 
          className="flex-1 bg-transparent border-none outline-none py-3 text-white font-cairo placeholder:text-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-red-500" /></div>
        ) : filteredLogs.length > 0 ? (
          <>
            {paginatedData.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass-panel p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border border-white/5"
              >
                <div className="flex items-center gap-6">
                   <div className="flex flex-col items-center justify-center text-gray-500 border-r border-white/10 pr-6">
                      <Calendar className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-sans">{new Date(log.created_at).toLocaleTimeString()}</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                         <User className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-white font-cairo">{log.username}</span>
                   </div>

                   <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 text-[11px] font-cairo text-gray-300">
                      <Activity className="w-3 h-3 text-[#00CED1]" />
                      {log.action}
                   </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="text-left font-mono text-[10px] text-gray-600">
                      {log.target_type} {log.target_id?.slice(0, 8)}
                   </div>
                   <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            ))}

            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-gray-600 font-cairo">لا توجد سجلات مطابقة للبحث.</div>
        )}
      </div>
    </div>
  );
}

