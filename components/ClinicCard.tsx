
import React, { useState } from 'react';
import { DentalClinic } from '../types';

interface ClinicCardProps {
  clinic: DentalClinic;
  onUpdateStatus: (id: string, status: DentalClinic['status']) => void;
  onUpdateNote: (id: string, notes: string) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onUpdateStatus, onUpdateNote }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);

  const phoneNumbers = clinic.phone ? clinic.phone.split(/[,/]/).map(p => p.trim()).filter(p => p) : [];

  const getStatusStyle = () => {
    if (clinic.status === 'positive') return 'border-emerald-500 bg-emerald-50/20';
    if (clinic.status === 'negative') return 'border-red-500 bg-red-50/20';
    if (clinic.status === 'contacted') return 'border-[#A3E635] bg-[#A3E635]/10';
    return 'border-slate-100 bg-white';
  };

  return (
    <div className={`group rounded-[1.2rem] border shadow-sm transition-all duration-300 flex flex-col h-full overflow-hidden ${getStatusStyle()}`}>
      <div className="p-4 flex flex-col h-full gap-3.5">
        {/* Başlık ve Lokasyon */}
        <div>
          <h3 className="text-slate-900 font-black text-sm leading-tight uppercase tracking-tighter line-clamp-2 min-h-[2.2rem]">
            {clinic.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
             <span className="text-[7px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">
               {clinic.district || 'Merkez'}
             </span>
             <span className="text-[7px] font-black border border-slate-200 text-slate-400 px-2 py-0.5 rounded-lg uppercase tracking-widest">
               {clinic.city}
             </span>
          </div>
        </div>

        {/* Tüm Telefonlar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">İletişim Kanalları</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {phoneNumbers.map((num, i) => (
              <a 
                key={i}
                href={`tel:${num}`} 
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200/30 transition-all group/call"
              >
                <div className="flex flex-col">
                  <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">
                    {num.startsWith('05') || num.startsWith('5') ? 'Cep Telefonu' : 'Sabit Hat'}
                  </span>
                  <span className="text-xs font-black text-slate-800 tracking-tight">{num}</span>
                </div>
                <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center group-hover/call:scale-105 transition-transform shadow-sm">
                  <i className="fas fa-phone-alt text-[8px]"></i>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Adres */}
        <div className="bg-slate-50/20 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-start gap-2">
            <i className="fas fa-map-marker-alt text-slate-300 mt-0.5 text-[10px]"></i>
            <p className="text-[9px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase tracking-tight">{clinic.address}</p>
          </div>
        </div>

        {/* Not Alanı */}
        <div>
          {showNoteInput ? (
            <div className="space-y-1.5">
              <textarea 
                className="w-full p-2.5 text-[10px] border border-blue-100 bg-white rounded-xl focus:border-blue-500 outline-none min-h-[50px] font-bold text-slate-700 shadow-inner"
                placeholder="Hekim hakkında notlar..."
                value={clinic.notes}
                onChange={(e) => onUpdateNote(clinic.id, e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => setShowNoteInput(false)} 
                className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest"
              >
                Kaydet
              </button>
            </div>
          ) : (
            <div 
              onClick={() => setShowNoteInput(true)}
              className="p-2 bg-blue-50/10 rounded-xl border border-dashed border-blue-100/40 cursor-pointer hover:bg-blue-50/30 transition-all"
            >
              <div className="flex items-center gap-2 text-blue-700/30">
                <i className="fas fa-edit text-[8px]"></i>
                <span className="text-[8px] font-black uppercase tracking-widest truncate">
                  {clinic.notes || 'Not ekle...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CRM Aksiyonları */}
        <div className="mt-auto pt-3 border-t border-slate-50">
          {clinic.status === 'none' ? (
            <button 
              onClick={() => onUpdateStatus(clinic.id, 'contacted')}
              className="w-full bg-[#A3E635] hover:bg-[#8FD42C] text-slate-900 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-lime-500/10 transition-all active:scale-95 border-b-2 border-[#84CC16]"
            >
              Görüşme Bilgisi Ekle
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'positive')}
                  className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 ${clinic.status === 'positive' ? 'bg-emerald-500 text-white border-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50'}`}
                >
                  <i className="fas fa-check text-[8px]"></i> Olumlu
                </button>
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'negative')}
                  className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1.5 border-b-2 ${clinic.status === 'negative' ? 'bg-red-500 text-white border-red-700' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-red-50'}`}
                >
                  <i className="fas fa-times text-[8px]"></i> Olumsuz
                </button>
              </div>
              <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="text-[7px] text-slate-300 font-black hover:text-slate-400 uppercase tracking-widest text-center">
                 Sıfırla
              </button>
            </div>
          )}
        </div>

        {/* Tıklanabilir Kaynak Linkleri */}
        {clinic.sourceLinks && clinic.sourceLinks.length > 0 && (
          <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-1.5">
            {clinic.sourceLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7px] font-black bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded transition-all flex items-center gap-1"
                title={`${link.name} sayfasına git`}
              >
                <i className="fas fa-external-link-alt text-[6px]"></i>
                {link.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicCard;
