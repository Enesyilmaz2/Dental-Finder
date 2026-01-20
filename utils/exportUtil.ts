
import { DentalClinic } from '../types';

export const exportToExcel = (data: DentalClinic[]) => {
  if (data.length === 0) return;

  // Excel'in (XLSX/CSV) doğru sütunlaması için noktalı virgül kullanılır.
  const headers = ['Şehir', 'İlçe', 'Klinik Adı', 'Telefon Numarası'];
  const rows = data.map(c => [
    `"${c.city}"`,
    `"${c.district}"`,
    `"${c.name}"`,
    `"${c.phone}"`
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  // UTF-8 BOM: Excel'in Türkçe karakterleri tanıması için zorunludur.
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const fileName = `dis_klinikleri_${new Date().toISOString().slice(0,10)}.xlsx`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
