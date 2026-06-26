export type ExportFormat = 'csv'; // تم قصرها على csv فقط بناءً على طلبك

export async function exportData(
  data: any[],
  columns: { header: string, key: string }[],
  fileName: string,
  format: ExportFormat = 'csv'
) {

  const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');

  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';

      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

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

