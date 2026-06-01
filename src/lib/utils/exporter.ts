export type ExportFormat = 'csv'; // تم قصرها على csv فقط بناءً على طلبك

export async function exportData(
  data: any[],
  columns: { header: string, key: string }[],
  fileName: string,
  format: ExportFormat = 'csv'
) {
  // 1. تحضير السطر الأول (العناوين / Headers)
  const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');

  // 2. تحضير صفوف البيانات
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
      // تحويل القيمة لنص والتعامل مع العلامات الاقتباسية لو موجودة جوة النص
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  // 3. تجميع ملف الـ CSV كامل
  const csvContent = [headers, ...rows].join('\n');

  // 4. إضافة ميزة الـ BOM (\uFEFF) عشان برنامج Excel يفتح العربي بشكل صحيح ومظبوط
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

  // 5. طريقة تحميل الملف الأصلية المتوافقة مع المتصفحات بدون أي مكتبات خارحية
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // تنظيف الذاكرة
  }
}
