import React from 'react';

interface RequestTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResult: any;
  requestQuantity: number;
  setRequestQuantity: (q: number) => void;
  requestNotes: string;
  setRequestNotes: (n: string) => void;
  handleRequestTransfer: () => void;
  loading: boolean;
}

export function RequestTransferModal({
  isOpen,
  onClose,
  selectedResult,
  requestQuantity,
  setRequestQuantity,
  requestNotes,
  setRequestNotes,
  handleRequestTransfer,
  loading
}: RequestTransferModalProps) {
  if (!isOpen || !selectedResult) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">طلب تحويل</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">المنتج</label>
            <div className="p-4 bg-[var(--glass-surface-heavy)] rounded-2xl font-bold">
              {selectedResult.product_name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">فرع</label>
            <div className="p-4 bg-[var(--glass-surface-heavy)] rounded-2xl font-bold">
              {selectedResult.pharmacy_name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">الكمية (المتاح: {selectedResult.total_quantity})</label>
            <input
              type="number"
              min="1"
              max={selectedResult.total_quantity}
              value={requestQuantity}
              onChange={(e) => setRequestQuantity(Number(e.target.value))}
              className="w-full p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl outline-none focus:border-[var(--primary)] text-center text-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleRequestTransfer}
              disabled={loading}
              className="flex-1 py-4 bg-[var(--primary)] text-white rounded-2xl font-bold hover:bg-[var(--primary-hover)] active:scale-95 transition-all text-center"
            >
              تأكيد الطلب
            </button>
            <button
              onClick={onClose}
              className="py-4 px-6 bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] hover:text-white rounded-2xl font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
