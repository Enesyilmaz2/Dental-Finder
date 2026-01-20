
import React, { useState } from 'react';
import { DentalClinic } from '../types';

interface ClinicCardProps {
  clinic: DentalClinic;
  onUpdateStatus: (id: string, status: DentalClinic['status']) => void;
  onUpdateNote: (id: string, notes: string) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onUpdateStatus, onUpdateNote }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);

  const phoneNumbers = clinic.phone ? clinic.phone.split(/[/|]/).map(p => p.trim()).filter(p => p.length > 5) : [];

  const getStatusStyle = () => {
    if (clinic.status === 'positive') return 'border-emerald-500 bg-emerald-50/10 shadow-emerald-100';
    if (clinic.status === 'negative') return 'border-red-500 bg-red-50/10 shadow-red-100';
    if (clinic.status === 'contacted') return 'border-lime-500 bg-lime-50/10 shadow-lime-100';
    return 'border-slate-100 bg-white';
  };

  return (
    <div className={`group rounded-2xl border transition-all duration-300 flex flex-col h-full overflow-hidden hover:shadow-lg ${getStatusStyle()}`}>
      <div className="p-3.5 flex flex-col h-full gap-2.5">
        <div>
          <h3 className="text-[#0F172A] font-black text-[11px] leading-tight uppercase tracking-tight line-clamp-2 min-h-[1.5rem]">
            {clinic.name}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
             <span className="text-[6px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase">{clinic.district || 'Genel'}</span>
             <span className="text-[6px] font-black border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded uppercase">{clinic.city}</span>
          </div>
        </div>

        <div className="space-y-1">
          {phoneNumbers.length > 0 ? phoneNumbers.map((num, i) => (
            <a key={i} href={`tel:${num}`} className="flex items-center justify-between bg-white hover:bg-blue-50 p-1.5 rounded-xl border border-slate-50 transition-all">
              <div className="flex flex-col">
                <span className="text-[5px] font-black text-slate-400 uppercase leading-none mb-0.5">{num.startsWith('05') ? 'CEP' : 'SABİT'}</span>
                <span className="text-[9px] font-black text-slate-800">{num}</span>
              </div>
              <div className="w-5 h-5 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md"><i className="fas fa-phone-alt text-[7px]"></i></div>
            </a>
          )) : <div className="p-1.5 text-[7px] text-slate-400 font-bold uppercase text-center border border-dashed rounded-xl">İletişim Yok</div>}
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <p className="text-[8px] text-slate-500 font-bold leading-snug line-clamp-2 uppercase">
            <i className="fas fa-map-marker-alt text-blue-400 mr-1"></i> {clinic.address}
          </p>
        </div>

        <div className="flex-1">
          {showNoteInput ? (
            <div className="space-y-1">
              <textarea 
                className="w-full p-2 text-[8px] border border-blue-200 bg-white rounded-xl focus:border-blue-500 outline-none min-h-[40px] font-bold"
                placeholder="Not yaz..."
                value={clinic.notes}
                onChange={(e) => onUpdateNote(clinic.id, e.target.value)}
                autoFocus
              />
              <button onClick={() => setShowNoteInput(false)} className="w-full py-1 bg-slate-800 text-white rounded-lg text-[7px] font-black uppercase">Kaydet</button>
            </div>
          ) : (
            <div onClick={() => setShowNoteInput(true)} className="p-2 bg-white/50 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-blue-300 transition-all min-h-[25px] flex items-center">
              <span className="text-[7px] font-black uppercase text-slate-300 truncate"><i className="fas fa-edit mr-1"></i> {clinic.notes || 'Not ekle'}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-50">
          {clinic.status === 'none' ? (
            <button 
              onClick={() => onUpdateStatus(clinic.id, 'contacted')}
              className="w-full bg-lime-300 hover:bg-lime-400 text-lime-900 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-lime-500/10 transition-all"
            >
              <i className="fas fa-comment-dots"></i> Görüşme Bilgisi Ekle
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => onUpdateStatus(clinic.id, 'positive')} className={`py-1.5 rounded-lg text-[7px] font-black uppercase flex items-center justify-center gap-1 ${clinic.status === 'positive' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}><i className="fas fa-check"></i> OLUMLU</button>
                <button onClick={() => onUpdateStatus(clinic.id, 'negative')} className={`py-1.5 rounded-lg text-[7px] font-black uppercase flex items-center justify-center gap-1 ${clinic.status === 'negative' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}><i className="fas fa-times"></i> OLUMSUZ</button>
              </div>
              <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="text-[6px] text-slate-300 font-bold hover:text-slate-500 uppercase text-center mt-0.5 underline">Durumu Sıfırla</button>
            </div>
          )}
        </div>

        {clinic.sourceLinks && clinic.sourceLinks.length > 0 && (
          <div className="pt-1.5 flex flex-wrap gap-2 border-t border-slate-50 mt-auto">
            {clinic.sourceLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[6px] font-black text-blue-500 hover:text-blue-700 flex items-center gap-1 uppercase tracking-tighter">
                <i className={`fas ${link.name.toLowerCase().includes('maps') ? 'fa-map-pin' : 'fa-globe'} text-[6px]`}></i> {link.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicCard;
