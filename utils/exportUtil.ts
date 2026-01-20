
import { DentalClinic } from '../types';

export const exportToExcel = (data: DentalClinic[]) => {
  if (data.length === 0) return;

  // CSV için başlıklar
  const headers = ['Klinik Adi', 'Telefon', 'Sehir', 'Ilce', 'Adres', 'Web Sitesi', 'Rating', 'Durum'];
  
  const rows = data.map(c => [
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.phone.replace(/"/g, '""')}"`,
    `"${c.city}"`,
    `"${c.district}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    `"${c.website || ''}"`,
    `"${c.rating || ''}"`,
    `"${c.status || 'Hicbiri'}"`
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\n');

  // UTF-8 BOM ekleyerek Türkçe karakterlerin Excel'de düzgün görünmesini sağlıyoruz
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const fileName = `dental_liste_${new Date().toISOString().slice(0,10)}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
