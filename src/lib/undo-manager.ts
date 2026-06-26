import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export type UndoAction = {
  type: 'SALE' | 'STOCK_UPDATE' | 'DELETE_PRODUCT' | 'DEBT_PAYMENT' | 'AGENT_ACTION';
  payload: any;
  timestamp: number;
};

class UndoManager {
  private lastAction: UndoAction | null = null;
  private listeners: ((action: UndoAction | null) => void)[] = [];

  push(action: UndoAction) {
    this.lastAction = { ...action, timestamp: Date.now() };
    this.notify();

    setTimeout(() => {
      if (this.lastAction?.timestamp === action.timestamp) {
        this.clear();
      }
    }, 10000);
  }

  clear() {
    this.lastAction = null;
    this.notify();
  }

  subscribe(callback: (action: UndoAction | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.lastAction));
  }

  async undo() {
    if (!this.lastAction) return { success: false, message: 'لا يوجد شيء للتراجع عنه' };

    const { type, payload } = this.lastAction;
    try {
      if (type === 'SALE') {

        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', payload.orderId);
        
        if (items) {
          for (const item of items) {
            if (item.batch_id) {
               const { data: batch } = await supabase.from('batches').select('quantity').eq('id', item.batch_id).single();
               if (batch) {
                 await supabase.from('batches').update({ quantity: batch.quantity + item.quantity }).eq('id', item.batch_id);
               }
            }
          }
        }

        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', payload.orderId);
        
        return { success: true, message: 'تم التراجع عن البيع وإعادة المخزون' };
      }

      if (type === 'STOCK_UPDATE') {
        await supabase.from('batches').update({ quantity: payload.oldQuantity }).eq('id', payload.batchId);
        return { success: true, message: 'تم التراجع عن تعديل المخزون' };
      }

      if (type === 'AGENT_ACTION') {
        const response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isUndo: true, logId: payload.logId, actionType: 'UNDO', payload: { table: 'logs' } })
        });
        const data = await response.json();
        return { success: response.ok, message: data.reply || 'تم التراجع عن عملية المساعد' };
      }

      return { success: false, message: 'نوع العملية غير مدعوم للتراجع' };
    } catch (err) {
      console.error('Undo Failed:', err);
      return { success: false, message: 'فشل التراجع بسبب خطأ في النظام' };
    } finally {
      this.clear();
    }
  }
}

export const undoManager = new UndoManager();

