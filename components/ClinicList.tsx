
import React from 'react';
import { DentalClinic } from '../types';

interface ClinicListProps {
  clinics: DentalClinic[];
  onUpdateStatus: (id: string, status: DentalClinic['status']) => void;
}

const ClinicList: React.FC<ClinicListProps> = ({ clinics, onUpdateStatus }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Durum</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Klinik / Hekim Bilgisi</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">İletişim</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasyon</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clinics.map((clinic) => (
              <tr key={clinic.id} className={`group hover:bg-slate-50/80 transition-all ${
                clinic.status === 'positive' ? 'bg-emerald-50/40' : 
                clinic.status === 'negative' ? 'bg-red-50/40' : 
                clinic.status === 'contacted' ? 'bg-amber-50/40' : ''
              }`}>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    {clinic.status === 'positive' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"></div>}
                    {clinic.status === 'negative' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-200"></div>}
                    {clinic.status === 'contacted' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm shadow-amber-200"></div>}
                    {clinic.status === 'none' && <div className="w-2 h-2 bg-slate-200 rounded-full"></div>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{clinic.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-xs truncate">{clinic.address}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-700">{clinic.phone || '-'}</span>
                    {clinic.phone && (
                      <a 
                        href={`tel:${clinic.phone}`} 
                        className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="Hemen Ara"
                      >
                        <i className="fas fa-phone text-[10px]"></i>
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{clinic.city}</span>
                    <span className="text-[10px] font-bold text-slate-500">{clinic.district}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onUpdateStatus(clinic.id, 'positive')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${clinic.status === 'positive' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-100 text-emerald-600'}`} title="Olumlu"><i className="fas fa-thumbs-up text-[10px]"></i></button>
                    <button onClick={() => onUpdateStatus(clinic.id, 'negative')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${clinic.status === 'negative' ? 'bg-red-500 text-white' : 'hover:bg-red-100 text-red-600'}`} title="Olumsuz"><i className="fas fa-thumbs-down text-[10px]"></i></button>
                    <button onClick={() => onUpdateStatus(clinic.id, 'contacted')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${clinic.status === 'contacted' ? 'bg-amber-500 text-white' : 'hover:bg-amber-100 text-amber-600'}`} title="İletişim Kuruldu"><i className="fas fa-comment-dots text-[10px]"></i></button>
                    <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400" title="Sıfırla"><i className="fas fa-undo text-[10px]"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClinicList;
