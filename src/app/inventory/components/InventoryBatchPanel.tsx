import React, { useState } from 'react';
import { Plus, Edit2, Check, X, Loader2, Save, Calendar, Hash } from 'lucide-react';
import { updateBatch, createBatch } from '@/lib/api/products';

interface Batch {
  id: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  expiry_date: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  company: string;
  inventory_method: string;
  total_quantity: number;
  current_price: number;
  batches: Batch[];
}

interface BatchFormInput {
  barcode: string;
  quantity: string;
  purchase_price: string;
  selling_price: string;
  expiry_date: string;
}

const initialFormState: BatchFormInput = {
  barcode: '',
  quantity: '0',
  purchase_price: '0',
  selling_price: '0',
  expiry_date: ''
};

interface InventoryBatchPanelProps {
  item: InventoryItem;
  fetchInventory: () => Promise<void>;
  setInventoryError: (error: string | null) => void;
}

export function InventoryBatchPanel({ item, fetchInventory, setInventoryError }: InventoryBatchPanelProps) {
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BatchFormInput>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  const [addingBatch, setAddingBatch] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState<BatchFormInput>(initialFormState);
  const [isAddingMode, setIsAddingMode] = useState(false);

  const validateForm = (form: BatchFormInput, checkExpiry = false): boolean => {
    const q = Number(form.quantity);
    const p = Number(form.purchase_price);
    const s = Number(form.selling_price);

    if (!form.barcode.trim()) {
      setInventoryError("خطأ: الباركود لا يمكن أن يكون فارغاً.");
      return false;
    }
    if (isNaN(q) || q <= 0 || isNaN(p) || p <= 0 || isNaN(s) || s <= 0) {
      setInventoryError("خطأ: الكمية والأسعار يجب أن تكون أرقاماً أكبر من صفر.");
      return false;
    }
    if (checkExpiry && !form.expiry_date) {
      setInventoryError("خطأ: يجب تحديد تاريخ انتهاء الصلاحية.");
      return false;
    }
    return true;
  };

  const startEditing = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setEditForm({
      barcode: batch.barcode,
      quantity: String(batch.quantity),
      purchase_price: String(batch.purchase_price),
      selling_price: String(batch.selling_price),
      expiry_date: batch.expiry_date,
    });
  };

  const cancelEditing = () => {
    setEditingBatchId(null);
    setEditForm(initialFormState);
  };

  const handleSaveBatch = async (batchId: string) => {
    if (!validateForm(editForm)) return;

    setIsSaving(true);
    try {
      await updateBatch(batchId, {
        quantity: Number(editForm.quantity),
        purchase_price: Number(editForm.purchase_price),
        selling_price: Number(editForm.selling_price),
        barcode: editForm.barcode.trim(),
      });
      setEditingBatchId(null);
      await fetchInventory();
    } catch (error) {
      setInventoryError("فشل تحديث بيانات التشغيلة.");
    } finally {
      setIsSaving(false);
    }
  };

  const startAddingBatch = () => {
    setIsAddingMode(true);
    setNewBatchForm(initialFormState);
  };

  const handleCreateBatch = async () => {
    if (!validateForm(newBatchForm, true)) return;

    setAddingBatch(true);
    try {
      await createBatch({
        product_id: item.id,
        barcode: newBatchForm.barcode.trim(),
        quantity: Number(newBatchForm.quantity),
        purchase_price: Number(newBatchForm.purchase_price),
        selling_price: Number(newBatchForm.selling_price),
        expiry_date: newBatchForm.expiry_date,
      });
      setIsAddingMode(false);
      await fetchInventory();
    } catch (error) {
      setInventoryError("فشل إضافة التشغيلة الجديدة.");
    } finally {
      setAddingBatch(false);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAddingMode ? (
          <div className="glass-card p-5 border-[#00CED1]/50 bg-[#00CED1]/5 relative shadow-[0_0_15px_rgba(0,206,209,0.1)]">
            <h4 className="text-sm font-bold text-[#00CED1] mb-3 flex items-center gap-2 font-cairo">
              <Plus className="w-4 h-4" /> إضافة تشغيلة جديدة
            </h4>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1 font-cairo">الباركود</label>
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                    value={newBatchForm.barcode}
                    onChange={(e) => setNewBatchForm({...newBatchForm, barcode: e.target.value})}
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-gray-400 block mb-1 font-cairo">الكمية</label>
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                    value={newBatchForm.quantity}
                    onChange={(e) => setNewBatchForm({...newBatchForm, quantity: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1 font-cairo">سعر الشراء</label>
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                    value={newBatchForm.purchase_price}
                    onChange={(e) => setNewBatchForm({...newBatchForm, purchase_price: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1 font-cairo">سعر البيع</label>
                  <input 
                    type="number"
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                    value={newBatchForm.selling_price}
                    onChange={(e) => setNewBatchForm({...newBatchForm, selling_price: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-cairo">تاريخ الانتهاء</label>
                <input 
                  type="date"
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1] [color-scheme:dark]"
                  value={newBatchForm.expiry_date}
                  onChange={(e) => setNewBatchForm({...newBatchForm, expiry_date: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => setIsAddingMode(false)}
                  className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 font-cairo text-sm"
                >
                  إلغاء
                </button>
                <button 
                  disabled={addingBatch}
                  onClick={handleCreateBatch}
                  className="px-3 py-1.5 rounded bg-gradient-to-r from-[#00CED1] to-[#00CED1]/80 text-black hover:opacity-90 font-bold font-cairo text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {addingBatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  حفظ
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={startAddingBatch}
            className="glass-card p-5 border-dashed border-white/20 hover:border-[#00CED1]/50 hover:bg-[#00CED1]/5 transition-all text-[#00CED1] font-cairo flex flex-col items-center justify-center gap-3 min-h-[160px]"
          >
            <Plus className="w-8 h-8" />
            <span className="font-bold">إضافة تشغيلة جديدة</span>
          </button>
        )}
        {item.batches.map((batch) => (
          <div key={batch.id} className="glass-card p-5 border-white/10 relative group hover:border-[#D4AF37]/30 transition-all">
            {editingBatchId === batch.id ? (
              <div className="space-y-4">
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block mb-1 font-cairo">الباركود</label>
                    <input 
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                      value={editForm.barcode}
                      onChange={(e) => setEditForm({...editForm, barcode: e.target.value})}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 block mb-1 font-cairo">الكمية</label>
                    <input 
                      type="number"
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block mb-1 font-cairo">سعر الشراء</label>
                    <input 
                      type="number"
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                      value={editForm.purchase_price}
                      onChange={(e) => setEditForm({...editForm, purchase_price: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block mb-1 font-cairo">سعر البيع</label>
                    <input 
                      type="number"
                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                      value={editForm.selling_price}
                      onChange={(e) => setEditForm({...editForm, selling_price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    onClick={cancelEditing}
                    className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleSaveBatch(batch.id)}
                    disabled={isSaving}
                    className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => startEditing(batch)}
                  className="absolute top-4 left-4 p-2 rounded-lg bg-white/5 text-gray-500 opacity-0 group-hover:opacity-100 transition-all hover:text-[#00CED1] hover:bg-[#00CED1]/10"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-cairo">
                    <Hash className="w-3 h-3" />
                    {batch.barcode}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${new Date(batch.expiry_date) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-[#00CED1]/10 text-[#00CED1]'}`}>
                    {new Date(batch.expiry_date) < new Date() ? 'منتهي' : 'صالح'}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 text-foreground font-bold mb-1">
                      <span className="text-2xl font-cairo">{batch.quantity}</span>
                      <span className="text-xs text-gray-500 font-cairo">علبة</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-cairo">
                      <Calendar className="w-3 h-3" />
                      <span>انتهاء:</span>
                      <span dir="ltr">{new Date(batch.expiry_date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="text-left flex gap-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-gray-500 font-cairo">سعر الشراء</p>
                      <p className="font-bold text-gray-400 font-cairo text-sm" dir="ltr">{batch.purchase_price} ج.م</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-gray-500 font-cairo">سعر البيع</p>
                      <p className="font-bold text-[#D4AF37] font-cairo text-sm" dir="ltr">{batch.selling_price} ج.م</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
