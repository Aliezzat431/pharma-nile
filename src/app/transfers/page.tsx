'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { searchOtherPharmacies, 
  requestTransfer, 
  getTransfers, 
  shipTransfer, 
  receiveTransfer, 
  cancelTransfer,
  StockTransfer
} from '@/lib/api/transfers';
import { getProducts } from '@/lib/api/products';
import { Search, Send, CheckCircle2, Clock, XCircle, ArrowRightLeft, Package, UserPlus } from 'lucide-react';
import { RequestTransferModal } from './components/RequestTransferModal';
import { ReceiveTransferModal } from './components/ReceiveTransferModal';

export default function TransfersPage() {
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 fade-in font-cairo" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold font-cairo">تحويلات الفروع</h1>
        <p className="text-[var(--text-muted)] mt-2">إدارة طلبات النواقص من الفروع الأخرى</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
          {error}
        </div>
      )}

      {}
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

      {}
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

      {}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-surface)]">
            <table className="w-full text-sm text-right">
              <thead className="bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] font-bold text-sm md:text-base">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 rounded-tr-3xl whitespace-nowrap">المنتج</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">الكمية</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">المرسل</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">المستقبل</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">الحالة</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">التاريخ</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 rounded-tl-3xl text-center whitespace-nowrap">الإجراء</th>
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
                      <tr key={t.id} className="hover:bg-[var(--glass-surface-heavy)] transition-colors text-sm md:text-base">
                        <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-[var(--foreground)] whitespace-nowrap">{t.product_name}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 font-bold whitespace-nowrap">{t.quantity}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          {isSender ? <span className="text-[var(--primary)] font-bold">(أنت)</span> : t.from_pharmacy?.name}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          {isReceiver ? <span className="text-[var(--primary)] font-bold">(أنت)</span> : t.to_pharmacy?.name}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-center whitespace-nowrap">
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

      {}
      <RequestTransferModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        selectedResult={selectedResult}
        requestQuantity={requestQuantity}
        setRequestQuantity={setRequestQuantity}
        requestNotes={requestNotes}
        setRequestNotes={setRequestNotes}
        handleRequestTransfer={handleRequestTransfer}
        loading={loading}
      />

      {}
      <ReceiveTransferModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        selectedTransfer={selectedTransfer}
        myProducts={myProducts}
        receiveProductId={receiveProductId}
        setReceiveProductId={setReceiveProductId}
        receiveCost={receiveCost}
        setReceiveCost={setReceiveCost}
        receivePrice={receivePrice}
        setReceivePrice={setReceivePrice}
        handleReceive={handleReceive}
        loading={loading}
      />
    </div>
  );
}

