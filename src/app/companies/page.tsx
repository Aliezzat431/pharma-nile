'use client';

import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, Plus, Search, Trash2, Edit, X, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, getCompanies, addCompany, updateCompany, deleteCompany } from '@/lib/api/companies';
import { CompanyModal } from './components/CompanyModal';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState<Omit<Company, 'id' | 'created_at' | 'pharmacy_id'>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error("Fetch companies error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await addCompany(formData);
      }
      setIsModalOpen(false);
      setEditingCompany(null);
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
      await fetchCompanies();
    } catch (err) {
      console.error("Submit error", err);
      alert("حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contact_person: company.contact_person || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشركة نهائياً؟')) {
      try {
        await deleteCompany(id);
        fetchCompanies();
      } catch (err) {
        console.error("Delete error", err);
        alert("تعذر حذف الشركة، قد تكون مرتبطة بسجلات أخرى.");
      }
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredCompanies,
    { pageSize: PAGE_SIZE }
  );

  return (
    <div className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-right" dir="rtl">
      <header className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            شركات <span className="nile-gradient-text text-[#00CED1]">الأدوية</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">إدارة الموردين والشركات المصنعة للأدوية.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCompany(null);
            setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
            setIsModalOpen(true);
          }}
          className="nile-button flex items-center gap-2 bg-[#00CED1] text-black px-5 py-3 rounded-xl font-bold font-cairo hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,206,209,0.15)]"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة شركة جديدة</span>
        </button>
      </header>

      {}
      <div className="glass-panel p-4 flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="ابحث عن شركة أو مندوب..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600 text-right"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.length > 0 ? (
              paginatedData.map((company, i) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-panel p-6 border border-white/5 hover:border-[#00CED1]/30 transition-all group relative flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#00CED1]/10 flex items-center justify-center text-[#00CED1] group-hover:scale-110 transition-transform border border-[#00CED1]/10">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(company)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors" title="تعديل">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(company.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold font-cairo text-white mb-1 truncate">{company.name}</h3>
                    <p className="text-[#D4AF37] text-sm font-cairo mb-4 truncate">{company.contact_person || 'لا يوجد مندوب مسجل'}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {company.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="w-4 h-4 text-[#00CED1]/70 flex-shrink-0" />
                        <span className="font-sans truncate">{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-4 h-4 text-[#00CED1]/70 flex-shrink-0" />
                        <span className="truncate font-sans">{company.email}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4 text-[#00CED1]/70 flex-shrink-0" />
                        <span className="truncate font-cairo">{company.address}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-500 font-cairo">
                لا توجد شركات مطابقة للبحث الحالي.
              </div>
            )}
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
        </>
      )}

      {}
      <CompanyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submitting={submitting}
        editingCompany={editingCompany}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
