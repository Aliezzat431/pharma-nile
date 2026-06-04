'use client';

import { useState, useEffect } from 'react';
import { Building2, Phone, Mail, Plus, Search, Trash2, Edit, X, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, getCompanies, addCompany, updateCompany, deleteCompany } from '@/lib/api/companies';

export default function CompaniesPage() {
  // تعريف الـ pharmacyId كـ state بدلاً من الـ Context
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState<Omit<Company, 'id' | 'created_at'>>({
    pharmacy_id: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  // 1️⃣ قراءة الـ pharmacyId من الـ localStorage عند تحميل المكون لأول مرة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('pharmacyId'); // أو حسب الاسم المخزن عندك مثلاً 'pharmacy_id'
      if (id) {
        setPharmacyId(id);
        setFormData(prev => ({ ...prev, pharmacy_id: id }));
      } else {
        setLoading(false); // وقف التحميل إذا لم يجد المعرف ليظهر رسالة التحذير
      }
    }
  }, []);

  // 2️⃣ جلب الشركات فور التأكد من وجود الـ pharmacyId
  useEffect(() => {
    if (pharmacyId) {
      fetchCompanies();
    }
  }, [pharmacyId]);

  const fetchCompanies = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await getCompanies(pharmacyId);
      setCompanies(data || []);
    } catch (err) {
      console.error("Fetch companies error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) return;

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, {
          ...formData,
          pharmacy_id: pharmacyId
        });
      } else {
        await addCompany({
          ...formData,
          pharmacy_id: pharmacyId
        });
      }
      setIsModalOpen(false);
      setEditingCompany(null);
      setFormData({ 
        pharmacy_id: pharmacyId, 
        name: '', 
        contact_person: '', 
        phone: '', 
        email: '', 
        address: '' 
      });
      fetchCompanies();
    } catch (err) {
      console.error("Submit error", err);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      pharmacy_id: company.pharmacy_id,
      name: company.name,
      contact_person: company.contact_person || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
      await deleteCompany(id);
      fetchCompanies();
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  // حماية الواجهة في حال عدم وجود معرف صيدلية صالح بعد انتهاء التحميل
  if (!pharmacyId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-cairo text-gray-400 gap-3">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <p>يرجى التأكد من تسجيل الدخول واختيار الصيدلية أولاً.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            شركات <span className="nile-gradient-text">الأدوية</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">إدارة الموردين والشركات المصنعة للأدوية.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCompany(null);
            setFormData({ 
              pharmacy_id: pharmacyId || '', 
              name: '', 
              contact_person: '', 
              phone: '', 
              email: '', 
              address: '' 
            });
            setIsModalOpen(true);
          }}
          className="nile-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-cairo">إضافة شركة جديدة</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="glass-panel p-4 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="ابحث عن شركة أو مندوب..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 border border-white/5 hover:border-[#00CED1]/30 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#00CED1]/10 flex items-center justify-center text-[#00CED1] group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(company)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(company.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold font-cairo mb-1">{company.name}</h3>
              <p className="text-[#D4AF37] text-sm font-cairo mb-4">{company.contact_person || 'لا يوجد مندوب'}</p>

              <div className="space-y-2 mt-auto">
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-[#00CED1]/70" />
                    <span className="font-sans">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-[#00CED1]/70" />
                    <span className="truncate">{company.email}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 text-[#00CED1]/70" />
                    <span className="truncate font-cairo">{company.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold font-cairo">
                  {editingCompany ? 'تعديل بيانات شركة' : 'إضافة شركة جديدة'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">اسم الشركة</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 focus:border-[#00CED1]/50 outline-none rounded-xl p-3 font-cairo"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 font-cairo mr-1">المندوب</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 focus:border-[#00CED1]/50 outline-none rounded-xl p-3 font-cairo"
                      value={formData.contact_person}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 font-cairo mr-1">رقم الهاتف</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 focus:border-[#00CED1]/50 outline-none rounded-xl p-3"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 focus:border-[#00CED1]/50 outline-none rounded-xl p-3"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">العنوان</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 focus:border-[#00CED1]/50 outline-none rounded-xl p-3 font-cairo"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <button type="submit" className="w-full nile-button py-4 font-bold text-lg mt-4 font-cairo">
                  {editingCompany ? 'حفظ التغييرات' : 'إضافة الشركة'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
