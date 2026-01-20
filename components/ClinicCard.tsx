
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
    if (clinic.status === 'contacted') return 'border-lime-500 bg-lime-50/20';
    return 'border-slate-100 bg-white';
  };

  return (
    <div className={`group rounded-[2rem] border shadow-sm transition-all duration-300 flex flex-col h-full overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 ${getStatusStyle()}`}>
      <div className="p-5 flex flex-col h-full gap-4">
        <div>
          <h3 className="text-slate-900 font-black text-sm leading-tight uppercase tracking-tighter line-clamp-2 min-h-[2.5rem]">
            {clinic.name}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
             <span className="text-[8px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
               {clinic.district || 'Merkez'}
             </span>
             <span className="text-[8px] font-black border border-slate-200 text-slate-400 px-2.5 py-1 rounded-lg uppercase tracking-widest">
               {clinic.city}
             </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">İletişim Kanalları</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {phoneNumbers.length > 0 ? phoneNumbers.map((num, i) => (
              <a 
                key={i}
                href={`tel:${num}`} 
                className="flex items-center justify-between bg-white hover:bg-blue-50 p-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all group/call"
              >
                <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                    {num.startsWith('05') || num.startsWith('5') ? 'Cep Telefonu' : 'Sabit Hat'}
                  </span>
                  <span className="text-[11px] font-black text-slate-800 tracking-tight">{num}</span>
                </div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover/call:rotate-12 transition-transform shadow-md">
                  <i className="fas fa-phone-alt text-[10px]"></i>
                </div>
              </a>
            )) : (
              <div className="p-3 text-[10px] text-slate-400 font-bold uppercase text-center border border-dashed rounded-2xl">Numara Bulunamadı</div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-3">
            <i className="fas fa-map-marker-alt text-blue-400 mt-0.5 text-xs"></i>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase tracking-tight">{clinic.address}</p>
          </div>
        </div>

        <div className="flex-1">
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea 
                className="w-full p-3 text-[10px] border-2 border-blue-100 bg-white rounded-2xl focus:border-blue-500 outline-none min-h-[60px] font-bold text-slate-700 shadow-inner"
                placeholder="Özel notlar..."
                value={clinic.notes}
                onChange={(e) => onUpdateNote(clinic.id, e.target.value)}
                autoFocus
              />
              <button onClick={() => setShowNoteInput(false)} className="w-full py-2 bg-[#0F172A] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Kaydet</button>
            </div>
          ) : (
            <div onClick={() => setShowNoteInput(true)} className="p-3 bg-white rounded-2xl border border-dashed border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[40px] flex items-center">
              <div className="flex items-center gap-3 text-slate-300">
                <i className="fas fa-sticky-note text-xs"></i>
                <span className="text-[9px] font-black uppercase tracking-widest truncate">
                  {clinic.notes || 'Hekim Hakkında Not Ekle...'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-50">
          {clinic.status === 'none' ? (
            <button 
              onClick={() => onUpdateStatus(clinic.id, 'contacted')}
              className="w-full bg-[#BEF264] hover:bg-[#A3E635] text-lime-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-lime-500/10 transition-all active:scale-95 border-b-4 border-lime-600/30"
            >
              <i className="fas fa-comment-dots text-sm"></i>
              Görüşme Bilgisi Ekle
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'positive')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${clinic.status === 'positive' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50'}`}
                >
                  <i className="fas fa-check"></i> Olumlu
                </button>
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'negative')}
                  className={`py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${clinic.status === 'negative' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-400 hover:bg-red-50'}`}
                >
                  <i className="fas fa-times"></i> Olumsuz
                </button>
              </div>
              <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="text-[8px] text-slate-300 font-bold hover:text-slate-500 uppercase tracking-widest text-center py-1">Seçimi Kaldır</button>
            </div>
          )}
        </div>

        {clinic.sourceLinks && clinic.sourceLinks.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2">
            {clinic.sourceLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[8px] font-black bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-slate-100"
              >
                <i className="fas fa-link text-[7px]"></i>
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
