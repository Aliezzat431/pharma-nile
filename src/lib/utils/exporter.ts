import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'pdf' | 'xlsx' | 'csv';

export async function exportData(
  data: any[],
  columns: { header: string, key: string }[],
  fileName: string,
  format: ExportFormat
) {
  const tableData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  if (format === 'csv' || format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${fileName}.csv`);
    } else {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}.xlsx`);
    }
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    
    // Arabic support in jsPDF requires font embedding, for now we use standard autoTable
    // In a real app we'd load an Arabic font (like Cairo) as a base64 string
    autoTable(doc, {
      head: [columns.map(c => c.header)],
      body: data.map(item => columns.map(c => item[c.key])),
      styles: { font: 'helvetica', halign: 'right' }
    });

    doc.save(`${fileName}.pdf`);
  }
}
