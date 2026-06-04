'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  searchOtherPharmacies, 
  requestTransfer, 
  getTransfers, 
  shipTransfer, 
  receiveTransfer, 
  cancelTransfer,
  StockTransfer
} from '@/lib/api/transfers';
import { getProducts } from '@/lib/api/products';
import { Search, Send, CheckCircle2, Clock, XCircle, ArrowRightLeft, Package, UserPlus } from 'lucide-react';

export default function TransfersPage() {
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [receiveProductId, setReceiveProductId] = useState('');
  const [receivePrice, setReceivePrice] = useState('');
  const [receiveCost, setReceiveCost] = useState('');
  const [receiveExpiry, setReceiveExpiry] = useState('');

  useEffect(() => {
    if (pharmacyId) {
      loadTransfers();
      loadMyProducts();
    }
  }, [pharmacyId]);

  const loadTransfers = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await getTransfers(pharmacyId);
      setTransfers(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProducts = async () => {
    if (!pharmacyId) return;
    try {
      const data = await getProducts(pharmacyId);
      setMyProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !pharmacyId) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchOtherPharmacies(searchTerm, pharmacyId);
      setSearchResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!selectedResult || !pharmacyId) return;
    if (requestQuantity > Number(selectedResult.total_quantity)) {
      setError('الكمية المطلوبة أكبر من المتاحة');
      return;
    }
    setLoading(true);
    try {
      await requestTransfer(
        selectedResult.pharmacy_id,
        pharmacyId,
        selectedResult.product_name,
        requestQuantity,
        requestNotes
      );
      setIsRequestModalOpen(false);
      setActiveTab('requests');
      loadTransfers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (transfer: any) => {
    setLoading(true);
    try {
      // Find the product id in our pharmacy for this transfer
      const myProduct = myProducts.find(p => p.name.toLowerCase() === transfer.product_name.toLowerCase());
      if (!myProduct) {
        throw new Error('المنتج غير موجود في قائمة المنتجات الخاصة بك');
      }
      await shipTransfer(transfer.id, pharmacyId, myProduct.id);
      loadTransfers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedTransfer || !pharmacyId || !receiveProductId) return;
    setLoading(true);
    try {
      await receiveTransfer(selectedTransfer.id, pharmacyId, {
        productId: receiveProductId,
        price: Number(receivePrice),
        cost: Number(receiveCost),
        expiryDate: receiveExpiry || undefined
      });
      setIsReceiveModalOpen(false);
      loadTransfers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openReceiveModal = (t: any) => {
    setSelectedTransfer(t);
    const match = myProducts.find(p => p.name.toLowerCase() === t.product_name.toLowerCase());
    if (match) setReceiveProductId(match.id);
    setIsReceiveModalOpen(true);
  };

  if (!pharmacyId) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 fade-in font-cairo" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold font-cairo">تحويلات الفروع</h1>
        <p className="text-[var(--text-muted)] mt-2">إدارة طلبات النواقص من الفروع الأخرى</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
          {error}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 p-1 bg-[var(--glass-surface)] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
        >
          طلبات التحويل
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'search' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
        >
          البحث في الفروع
        </button>
      </div>

      {/* SEARCH TAB */}
      {activeTab === 'search' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن منتج في الفروع الأخرى..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              بحث
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((res: any, idx) => (
              <div key={idx} className="bg-[var(--glass-surface)] border border-[var(--glass-border)] p-6 rounded-3xl hover:border-[var(--primary)] transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-green-500/10 text-green-400 rounded-full">
                    متاح: {res.total_quantity}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">{res.product_name}</h3>
                <p className="text-[var(--text-muted)] text-sm mb-6 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  فرع: {res.pharmacy_name}
                </p>
                <button
                  onClick={() => {
                    setSelectedResult(res);
                    setRequestQuantity(1);
                    setRequestNotes('');
                    setIsRequestModalOpen(true);
                  }}
                  className="w-full py-3 bg-[var(--glass-surface-heavy)] hover:bg-[var(--primary)] hover:text-white active:scale-95 text-[var(--foreground)] rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  طلب تحويل
                </button>
              </div>
            ))}
            {searchResults.length === 0 && !loading && searchTerm && (
              <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
                لا يوجد نتائج في الفروع الأخرى
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)]">
            <table className="w-full text-sm text-right">
              <thead className="bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] font-bold">
                <tr>
                  <th className="px-6 py-4 rounded-tr-3xl">المنتج</th>
                  <th className="px-6 py-4">الكمية</th>
                  <th className="px-6 py-4">المرسل</th>
                  <th className="px-6 py-4">المستقبل</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4 rounded-tl-3xl text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">
                      لا يوجد تحويلات حالياً
                    </td>
                  </tr>
                ) : (
                  transfers.map((t: any) => {
                    const isSender = t.from_pharmacy_id === pharmacyId;
                    const isReceiver = t.to_pharmacy_id === pharmacyId;
                    
                    let statusColor = 'text-yellow-400 bg-yellow-400/10';
                    let statusLabel = 'قيد الانتظار';
                    if (t.status === 'shipped') {
                      statusColor = 'text-blue-400 bg-blue-400/10';
                      statusLabel = 'تم الشحن';
                    } else if (t.status === 'completed') {
                      statusColor = 'text-green-400 bg-green-400/10';
                      statusLabel = 'مكتمل';
                    } else if (t.status === 'cancelled') {
                      statusColor = 'text-red-400 bg-red-400/10';
                      statusLabel = 'ملغي';
                    }

                    return (
                      <tr key={t.id} className="hover:bg-[var(--glass-surface-heavy)] transition-colors">
                        <td className="px-6 py-4 font-bold text-[var(--foreground)]">{t.product_name}</td>
                        <td className="px-6 py-4 font-bold">{t.quantity}</td>
                        <td className="px-6 py-4">
                          {isSender ? <span className="text-[var(--primary)] font-bold">(أنت)</span> : t.from_pharmacy?.name}
                        </td>
                        <td className="px-6 py-4">
                          {isReceiver ? <span className="text-[var(--primary)] font-bold">(أنت)</span> : t.to_pharmacy?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">
                          {new Date(t.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {isSender && t.status === 'pending' && (
                              <button
                                onClick={() => handleShip(t)}
                                disabled={loading}
                                className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                              >
                                شحن
                              </button>
                            )}
                            {isReceiver && t.status === 'shipped' && (
                              <button
                                onClick={() => openReceiveModal(t)}
                                disabled={loading}
                                className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                              >
                                استلام
                              </button>
                            )}
                            {t.status === 'pending' && (
                              <button
                                onClick={() => cancelTransfer(t.id, pharmacyId).then(loadTransfers)}
                                disabled={loading}
                                className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                              >
                                إلغاء
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUEST MODAL */}
      {isRequestModalOpen && selectedResult && (
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
                  onClick={() => setIsRequestModalOpen(false)}
                  className="py-4 px-6 bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] hover:text-white rounded-2xl font-bold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE MODAL */}
      {isReceiveModalOpen && selectedTransfer && (
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
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="py-4 px-6 bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] hover:text-white rounded-2xl font-bold transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
