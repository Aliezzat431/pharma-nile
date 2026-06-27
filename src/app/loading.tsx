import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 border-4 border-emerald-500/20 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-emerald-500 rounded-full border-b-transparent animate-spin-slow duration-1000"></div>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
        </div>
        
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
              جاري التحميل
            </h3>
            <div className="flex space-x-1 rtl:space-x-reverse h-6 items-end pb-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">الرجاء الانتظار قليلاً لتهيئة البيانات</p>
        </div>
      </div>
    </div>
  );
}
