
import React, { useState } from 'react';
import { DentalClinic } from '../types';

interface ClinicCardProps {
  clinic: DentalClinic;
  onUpdateStatus: (id: string, status: DentalClinic['status']) => void;
  onUpdateNote: (id: string, notes: string) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onUpdateStatus, onUpdateNote }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);

  const phoneNumbers = clinic.phone ? clinic.phone.split(/[,/|]/).map(p => p.trim()).filter(p => p.length > 5) : [];

  const getStatusStyle = () => {
    if (clinic.status === 'positive') return 'border-emerald-500 bg-emerald-50/20';
    if (clinic.status === 'negative') return 'border-red-500 bg-red-50/20';
    if (clinic.status === 'contacted') return 'border-lime-500 bg-lime-50/20';
    return 'border-slate-100 bg-white';
  };

  return (
    <div className={`group rounded-[1.5rem] border shadow-sm transition-all duration-300 flex flex-col h-full overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 ${getStatusStyle()}`}>
      <div className="p-4 flex flex-col h-full gap-3">
        <div>
          <h3 className="text-slate-900 font-black text-xs leading-tight uppercase tracking-tighter line-clamp-2 min-h-[2.5rem]">
            {clinic.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
             <span className="text-[7px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-widest">
               {clinic.district || 'Genel'}
             </span>
             <span className="text-[7px] font-black border border-slate-200 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-widest">
               {clinic.city}
             </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-1 gap-1">
            {phoneNumbers.length > 0 ? phoneNumbers.map((num, i) => (
              <a 
                key={i}
                href={`tel:${num}`} 
                className="flex items-center justify-between bg-white hover:bg-blue-50 p-2 rounded-xl border border-slate-100 shadow-sm transition-all group/call"
              >
                <div className="flex flex-col">
                  <span className="text-[6px] font-black text-slate-400 uppercase">{num.startsWith('05') ? 'Cep' : 'Sabit'}</span>
                  <span className="text-[10px] font-black text-slate-800 tracking-tight">{num}</span>
                </div>
                <div className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
                  <i className="fas fa-phone-alt text-[8px]"></i>
                </div>
              </a>
            )) : (
              <div className="p-2 text-[8px] text-slate-400 font-bold uppercase text-center border border-dashed rounded-xl">İletişim yok</div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <p className="text-[9px] text-slate-500 font-bold leading-relaxed line-clamp-2 uppercase tracking-tight">
            <i className="fas fa-map-marker-alt text-blue-400 mr-1.5"></i>
            {clinic.address}
          </p>
        </div>

        <div className="flex-1">
          {showNoteInput ? (
            <div className="space-y-1">
              <textarea 
                className="w-full p-2 text-[9px] border-2 border-blue-100 bg-white rounded-xl focus:border-blue-500 outline-none min-h-[50px] font-bold text-slate-700 shadow-inner"
                placeholder="Özel notlar..."
                value={clinic.notes}
                onChange={(e) => onUpdateNote(clinic.id, e.target.value)}
                autoFocus
              />
              <button onClick={() => setShowNoteInput(false)} className="w-full py-1.5 bg-[#0F172A] text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Kaydet</button>
            </div>
          ) : (
            <div onClick={() => setShowNoteInput(true)} className="p-2 bg-white rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-blue-400 transition-all min-h-[35px] flex items-center">
              <span className="text-[8px] font-black uppercase text-slate-300 truncate">
                <i className="fas fa-sticky-note mr-2"></i>
                {clinic.notes || 'Not ekle...'}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-50">
          {clinic.status === 'none' ? (
            <button 
              onClick={() => onUpdateStatus(clinic.id, 'contacted')}
              className="w-full bg-[#D9F99D] hover:bg-[#BEF264] text-lime-900 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-lime-500/10 transition-all border-b-2 border-lime-400"
            >
              <i className="fas fa-comment-dots text-xs"></i>
              Görüşme Bilgisi Ekle
            </button>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'positive')}
                  className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2 ${clinic.status === 'positive' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                  <i className="fas fa-check"></i> Olumlu
                </button>
                <button 
                  onClick={() => onUpdateStatus(clinic.id, 'negative')}
                  className={`py-2 rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-2 ${clinic.status === 'negative' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                  <i className="fas fa-times"></i> Olumsuz
                </button>
              </div>
              <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="text-[7px] text-slate-300 font-bold hover:text-slate-500 uppercase text-center">İptal</button>
            </div>
          )}
        </div>

        {clinic.sourceLinks && clinic.sourceLinks.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-50">
            {clinic.sourceLinks.map((link, idx) => (
              <a 
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7px] font-black text-blue-500 hover:text-blue-700 transition-all flex items-center gap-1 uppercase"
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
