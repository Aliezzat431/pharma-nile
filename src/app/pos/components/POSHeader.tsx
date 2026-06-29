import { Barcode, Wifi, WifiOff } from 'lucide-react';

interface POSHeaderProps {
  isOnline?: boolean;
}

export function POSHeader({ isOnline = true }: POSHeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold font-cairo">
        نقطة <span className="text-[#00CED1]">البيع</span> (POS)
      </h1>
      <div className="flex gap-4 w-full md:w-auto">
        <div className="glass-card px-4 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 font-cairo w-full md:w-auto">
          <Barcode className="w-4 h-4 text-[#00CED1]" /> الماسح جاهز
        </div>
        <div className={`glass-card px-4 py-2 text-sm flex items-center justify-center gap-2 font-cairo w-full md:w-auto border transition-all duration-300 ${
          isOnline
            ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
            : 'border-amber-500/30 text-amber-400 bg-amber-500/5 animate-pulse'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>متصل بالشبكة</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>قاعدة البيانات المحلية (معاينة فقط)</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
