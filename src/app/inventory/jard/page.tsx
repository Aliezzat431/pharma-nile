'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/dexie';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
import { Upload, ChevronRight, Save, Database, AlertTriangle, Loader2 } from 'lucide-react';
import GlassTable from '@/components/ui/GlassTable';

export default function JardWizardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState<'upload' | 'audit'>('upload');
  const [items, setItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const session = await db.inventory_sessions.where('status').equals('active').first();
    if (session) {
      setSessionInfo(session);
      loadDraftItems();
      setPhase('audit');
    }
  };

  const loadDraftItems = async () => {
    const drafts = await db.draft_inventory.where('status').equals('pending').toArray();
    setItems(drafts);
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const parsedItems = json.map((row: any, index: number) => ({
        batchId: row['Batch ID'] || row['batch_id'] || `TEMP_${index}`,
        productId: row['Product ID'] || row['product_id'] || `UNKNOWN_${index}`,
        barcode: row['Barcode'] || row['barcode'] || '',
        name: row['Name'] || row['الإسم'] || row['name'] || 'مجهول',
        expectedQuantity: Number(row['Expected Qty'] || row['الكمية المتوقعة'] || row['quantity']) || 0,
        actualQuantity: '',
        status: 'pending'
      }));

      const sessionId = await db.inventory_sessions.add({
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        totalItems: parsedItems.length
      });

      await db.draft_inventory.bulkAdd(parsedItems);
      setSessionInfo({ id: sessionId, totalItems: parsedItems.length });
      setItems(parsedItems);
      setPhase('audit');
    } catch (e) {
      console.error(e);
      alert('فشل قراءة الملف. يرجى التأكد من الصيغة.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleQuantityChange = async (batchId: string, value: string) => {
    const newItems = [...items];
    const index = newItems.findIndex(i => i.batchId === batchId);
    if (index !== -1) {
      newItems[index].actualQuantity = value;
      setItems(newItems);
      
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        await db.draft_inventory.where('batchId').equals(batchId).modify({ actualQuantity: numValue });
      }
    }
  };

  const handleIntermediateSave = async () => {
    setIsProcessing(true);
    try {
      const confirmedItems = items.filter(i => i.actualQuantity !== '' && !isNaN(parseInt(i.actualQuantity)));
      
      if (confirmedItems.length === 0) {
        alert('لم تقم بتأكيد أي كميات.');
        setIsProcessing(false);
        return;
      }

      // Sync confirmed to database using backend RPC or direct updates
      // Note: Ideally, would use RPC `update_inventory_batch_quantities`
      for (const item of confirmedItems) {
        if (!item.batchId.startsWith('TEMP_')) {
          await supabase.from('batches').update({ quantity: parseInt(item.actualQuantity) }).eq('id', item.batchId);
        }
      }

      // Mark as confirmed in Dexie
      await Promise.all(confirmedItems.map(item => 
        db.draft_inventory.where('batchId').equals(item.batchId).modify({ status: 'confirmed' })
      ));

      const remaining = await db.draft_inventory.where('status').equals('pending').toArray();
      setItems(remaining);

      if (remaining.length === 0 && sessionInfo) {
        await db.inventory_sessions.update(sessionInfo.id, { status: 'completed' });
        await db.draft_inventory.clear();
        alert('تم الجرد بالكامل بنجاح!');
        router.push('/inventory');
      } else {
        alert(`تم التحديث بنجاح. متبقي ${remaining.length} صنف.`);
      }

    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ.');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    { header: 'الباركود', accessor: (it: any) => it.barcode || '---' },
    { header: 'الصنف', accessor: (it: any) => it.name },
    { header: 'الكمية المتوقعة (النظام)', accessor: (it: any) => <span className="text-gray-400 font-mono">{it.expectedQuantity}</span> },
    { 
      header: 'الكمية الفعلية (جرد)', 
      accessor: (it: any) => (
        <input 
          type="number"
          placeholder="أدخل العدد"
          value={it.actualQuantity}
          onChange={(e) => handleQuantityChange(it.batchId, e.target.value)}
          className="bg-black/50 border border-[var(--nile-teal)]/30 rounded-lg px-3 py-1 outline-none text-[var(--royal-gold)] font-bold text-center w-32"
        />
      ) 
    }
  ];

  if (phase === 'upload') {
    return (
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8">
          <ChevronRight className="w-5 h-5" /> رجوع
        </button>
        <h1 className="text-3xl font-bold font-cairo nile-gradient-text mb-4">الجرد العكسي (مساعد الجرد)</h1>
        <p className="text-gray-400 font-cairo mb-8">قم برفع ملف إكسيل للصيغة المتوقعة للبدء في الجرد دون الحاجة للاتصال بالإنترنت.</p>

        <div 
          className="border-2 border-dashed border-[var(--glass-border)] rounded-3xl p-24 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--nile-teal)] transition"
          onClick={() => document.getElementById('jard-upload')?.click()}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input type="file" id="jard-upload" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => {
            if (e.target.files && e.target.files[0]) parseFile(e.target.files[0]);
          }} />
          {isProcessing ? <Loader2 className="w-12 h-12 text-[var(--nile-teal)] animate-spin" /> : <Upload className="w-12 h-12 text-[var(--nile-teal)] mb-4" />}
          <p className="font-bold text-xl font-cairo mb-2">اضغط هنا لرفع الملف</p>
          <p className="text-gray-500 font-cairo text-sm">صيغة إكسيل المعتمدة أو CSV (.xlsx, .csv)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cairo flex items-center gap-3">
            <Database className="text-[var(--royal-gold)]" />
            تأكيد كميات الجرد
          </h1>
          <p className="text-gray-400 font-cairo mt-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            الأصناف المتبقية في هذه الجلسة المشفرة: {items.length}
          </p>
        </div>
        <button 
          onClick={handleIntermediateSave}
          disabled={isProcessing}
          className="px-6 py-3 bg-gradient-to-r from-[var(--nile-teal)] to-[#01AFB2] text-black font-bold rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التقدم وعمل مسودة
        </button>
      </div>

      <div className="glass-panel p-2">
        <GlassTable columns={columns} data={items} emptyMessage="لا توجد بيانات بانتظار الجرد." />
      </div>
    </div>
  );
}
