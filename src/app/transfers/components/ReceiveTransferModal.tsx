import React from 'react';

interface ReceiveTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransfer: any;
  myProducts: any[];
  receiveProductId: string;
  setReceiveProductId: (id: string) => void;
  receiveCost: string;
  setReceiveCost: (c: string) => void;
  receivePrice: string;
  setReceivePrice: (p: string) => void;
  handleReceive: () => void;
  loading: boolean;
}

export function ReceiveTransferModal({
  isOpen,
  onClose,
  selectedTransfer,
  myProducts,
  receiveProductId,
  setReceiveProductId,
  receiveCost,
  setReceiveCost,
  receivePrice,
  setReceivePrice,
  handleReceive,
  loading
}: ReceiveTransferModalProps) {
  if (!isOpen || !selectedTransfer) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">استلام تحويل</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">ربط بمنتج موجود (مطلوب)</label>
            <select
              value={receiveProductId}
              onChange={(e) => setReceiveProductId(e.target.value)}
              className="w-full p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl outline-none focus:border-[var(--primary)] font-bold text-white max-h-48"
            >
              <option value="">-- اختر المنتج --</option>
              {myProducts.map(p => (
                <option key={p.id} value={p.id} className="bg-[var(--background)]">
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-yellow-500 mt-2">
              يجب أن يكون المنتج مسجلاً في فرعك مسبقاً.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">سعر الشراء</label>
              <input
                type="number"
                value={receiveCost}
                onChange={(e) => setReceiveCost(e.target.value)}
                className="w-full p-3 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl outline-none focus:border-[var(--primary)] text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">سعر البيع</label>
              <input
                type="number"
                value={receivePrice}
                onChange={(e) => setReceivePrice(e.target.value)}
                className="w-full p-3 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl outline-none focus:border-[var(--primary)] text-center font-bold"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleReceive}
              disabled={loading || !receiveProductId}
              className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 active:scale-95 transition-all text-center disabled:opacity-50"
            >
              تأكيد الاستلام
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
