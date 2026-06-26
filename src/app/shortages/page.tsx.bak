'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Printer, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  Trash2,
  Download,
  Building2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getCompanies, Company } from '@/lib/api/companies';
import { useAuth } from '@/hooks/useAuth';
import GlassTable from '@/components/ui/GlassTable';
import Skeleton from '@/components/ui/Skeleton';

interface ShortageItem {
  id: string;
  name: string;
  company_name: string;
  total_quantity: number;
  priority: 'Ø¹Ø§Ù„ÙŠ' | 'Ù…ØªÙˆØ³Ø·' | 'Ø¹Ø§Ø¯ÙŠ';
}

export default function ShortagesPage() {
  const [items, setItems] = useState<ShortageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const pharmacyId = user?.user_metadata?.pharmacy_id;
    if (!pharmacyId) return;

    setLoading(true);
    try {
      const [compRes, shortageRes] = await Promise.all([
        getCompanies(),
        supabase
          .from('product_inventory')
          .select('*')
          .eq('pharmacy_id', pharmacyId) // Filter by pharmacy
          .lt('total_quantity', 15) // Threshold for shortages
      ]);

      setCompanies(compRes);

      if (shortageRes.data) {

        const mapped: ShortageItem[] = shortageRes.data.map((item: any) => ({
          id: item.product_id || item.id,
          name: item.name,
          company_name: item.company || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯',
          total_quantity: item.total_quantity,
          priority: item.total_quantity < 5 ? 'Ø¹Ø§Ù„ÙŠ' : item.total_quantity < 10 ? 'Ù…ØªÙˆØ³Ø·' : 'Ø¹Ø§Ø¯ÙŠ'
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error("Error fetching shortages:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const updatePriority = (id: string, priority: ShortageItem['priority']) => {
    setItems(items.map(item => item.id === id ? { ...item, priority } : item));
  };

  const filteredItems = items.filter(item => {
    const matchesCompany = filterCompany === 'all' || item.company_name === filterCompany;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  const handlePrint = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const grouped: Record<string, ShortageItem[]> = {};
    selectedItems.forEach(item => {
      if (!grouped[item.company_name]) grouped[item.company_name] = [];
      grouped[item.company_name].push(item);
    });

    const content = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px;">
        <h1 style="text-align: center; color: #00CED1;">Ø·Ù„Ø¨ ØªÙˆØ±ÙŠØ¯ Ø£Ø¯ÙˆÙŠØ© - PharmaNile</h1>
        <p style="text-align: center; color: #666;">Ø§Ù„ØªØ§Ø±ÙŠØ®: ${new Date().toLocaleDateString('ar-EG')}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        
        ${Object.entries(grouped).map(([company, products]) => `
          <div style="margin-bottom: 30px; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Ø§Ù„Ø´Ø±ÙƒØ©: ${company}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9f9f9;">
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Ø§Ù„ØµÙ†Ù</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ø­Ø§Ù„ÙŠ</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Ø§Ù„ÙƒÙ…ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.total_quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.priority}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-style: italic; color: #ccc;">__________</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head><title>Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ù†ÙˆØ§Ù‚Øµ - PharmaNile</title></head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = [
    {
      header: '',
      accessor: (item: ShortageItem) => (
        <input 
          type="checkbox" 
          checked={selectedIds.has(item.id)} 
          onChange={() => toggleSelect(item.id)}
          className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#00CED1] cursor-pointer"
        />
      ),
      className: 'w-[50px] text-center'
    },
    {
      header: 'Ø§Ù„ØµÙ†Ù',
      accessor: (item: ShortageItem) => (
        <div className="flex flex-col text-right">
          <span className="font-bold font-cairo">{item.name}</span>
          <span className="text-[10px] text-gray-500 font-inter">{item.id?.substring(0, 8) || ''}</span>
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Ø§Ù„Ø´Ø±ÙƒØ©',
      accessor: (item: ShortageItem) => (
        <div className="flex items-center justify-end gap-2 text-gray-400">
          <span className="text-xs font-cairo">{item.company_name}</span>
          <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'Ø§Ù„Ø±ØµÙŠØ¯',
      accessor: (item: ShortageItem) => (
        <span className={`font-bold font-inter ${item.total_quantity < 5 ? 'text-red-400' : 'text-orange-400'}`}>
          {item.total_quantity}
        </span>
      ),
      className: 'text-center w-[100px]'
    },
    {
      header: 'Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©',
      accessor: (item: ShortageItem) => (
        <select 
          value={item.priority}
          onChange={(e) => updatePriority(item.id, e.target.value as any)}
          className={`bg-[#050505]/50 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none font-cairo transition-colors
            ${item.priority === 'Ø¹Ø§Ù„ÙŠ' ? 'text-red-400 border-red-500/30' : 
              item.priority === 'Ù…ØªÙˆØ³Ø·' ? 'text-orange-400 border-orange-500/30' : 
              'text-blue-400 border-blue-500/30'}
          `}
        >
          <option value="Ø¹Ø§Ù„ÙŠ">Ø¹Ø§Ù„ÙŠ</option>
          <option value="Ù…ØªÙˆØ³Ø·">Ù…ØªÙˆØ³Ø·</option>
          <option value="Ø¹Ø§Ø¯ÙŠ">Ø¹Ø§Ø¯ÙŠ</option>
        </select>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-20 animate-entrance">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-cairo tracking-tight">Ø¥Ø¯Ø§Ø±Ø© <span className="nile-gradient-text">Ø§Ù„Ù†ÙˆØ§Ù‚Øµ</span></h1>
          <p className="text-gray-500 font-cairo text-lg">ØªØªØ¨Ø¹ Ø§Ù„Ø£ØµÙ†Ø§Ù Ø§Ù„ØªÙŠ Ø§Ù‚ØªØ±Ø¨Øª Ù…Ù† Ø§Ù„Ù†ÙØ§Ø¯ ÙˆÙ‚Ù… Ø¨Ø·Ù„Ø¨Ù‡Ø§ Ù…Ù† Ø§Ù„Ø´Ø±ÙƒØ§Øª.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-bold font-cairo transition-all shadow-xl
              ${selectedIds.size > 0 
                ? 'bg-[#00CED1] text-black hover:scale-[1.02] active:scale-95' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
            `}
          >
            <Printer className="w-5 h-5" />
            <span>Ø·Ø¨Ø§Ø¹Ø© Ø·Ù„Ø¨ ØªÙˆØ±ÙŠØ¯ ({selectedIds.size})</span>
          </button>
        </div>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input 
            type="text" 
            placeholder="Ø§Ø¨Ø­Ø« Ø¹Ù† ØµÙ†Ù..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 text-white placeholder-gray-500 font-cairo"
          />
        </div>

        <div className="glass-panel p-2 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500 mr-3" />
          <select 
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 text-white appearance-none font-cairo cursor-pointer"
          >
            <option value="all" className="bg-[#111]">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø´Ø±ÙƒØ§Øª</option>
            {companies.map(c => (
              <option key={c.id} value={c.name} className="bg-[#111]">{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between glass-panel px-6 py-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00CED1]" />
            <span className="text-sm font-bold font-cairo">ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ÙƒÙ„</span>
          </div>
          <button 
            onClick={toggleSelectAll}
            className="text-xs bg-[#00CED1]/10 text-[#00CED1] px-3 py-1.5 rounded-lg border border-[#00CED1]/20 hover:bg-[#00CED1]/20 font-bold"
          >
            {selectedIds.size === filteredItems.length ? 'Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ØªØ­Ø¯ÙŠØ¯' : 'ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…ØµÙÙ‰'}
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†ÙˆØ§Ù‚Øµ', value: items.length, icon: AlertCircle, color: 'text-gray-400' },
          { label: 'Ø£ÙˆÙ„ÙˆÙŠØ© Ø¹Ø§Ù„ÙŠØ©', value: items.filter(i => i.priority === 'Ø¹Ø§Ù„ÙŠ').length, icon: Clock, color: 'text-red-400' },
          { label: 'Ø´Ø±ÙƒØ§Øª Ù…ØªØ£Ø«Ø±Ø©', value: new Set(items.map(i => i.company_name)).size, icon: Building2, color: 'text-[#D4AF37]' },
          { label: 'Ù…Ø®ØªØ§Ø± Ù„Ù„Ø·Ù„Ø¨', value: selectedIds.size, icon: CheckCircle2, color: 'text-[#00CED1]' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 h-auto flex items-center gap-4 border-white/5">
            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase font-cairo">{stat.label}</p>
              <p className="text-lg font-bold font-inter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="relative">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <GlassTable 
            columns={columns} 
            data={filteredItems} 
            emptyMessage="Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ÙˆØ§Ù‚Øµ Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„Ø¨Ø­Ø«"
          />
        )}
      </div>
    </div>
  );
}


