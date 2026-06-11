import { Barcode } from 'lucide-react';

export function POSHeader() {
  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold font-cairo">
        نقطة <span className="text-[#00CED1]">البيع</span> (POS)
      </h1>
      <div className="flex gap-4 w-full md:w-auto">
        <div className="glass-card px-4 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 font-cairo w-full md:w-auto">
          <Barcode className="w-4 h-4 text-[#00CED1]" /> الماسح جاهز
        </div>
      </div>
    </header>
  );
}
