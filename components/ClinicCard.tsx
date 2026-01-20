
import React, { useState } from 'react';
import { DentalClinic } from '../types';

interface ClinicCardProps {
  clinic: DentalClinic;
  onUpdateStatus: (id: string, status: DentalClinic['status']) => void;
  onUpdateNote: (id: string, notes: string) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onUpdateStatus, onUpdateNote }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);

  const clinicImages = [
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09",
    "https://images.unsplash.com/photo-1598256989800-fe5f95da9787",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514"
  ];
  const randomImg = clinicImages[Math.floor(Math.abs(clinic.name.length % 4))] + "?auto=format&fit=crop&q=80&w=400";

  const openInMaps = () => {
    const query = encodeURIComponent(`${clinic.name} ${clinic.address} ${clinic.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col h-full border-t-4 ${
      clinic.status === 'positive' ? 'border-t-emerald-500' : 
      clinic.status === 'negative' ? 'border-t-red-500' : 
      clinic.status === 'contacted' ? 'border-t-amber-500' : 'border-t-transparent'
    }`}>
      <div className="h-32 bg-slate-200 relative overflow-hidden group cursor-pointer" onClick={openInMaps}>
        <img src={randomImg} alt={clinic.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-2 right-2 flex gap-1">
           {clinic.status !== 'none' && (
             <div className={`px-2 py-1 rounded-md text-[9px] font-black text-white shadow-lg uppercase ${
               clinic.status === 'positive' ? 'bg-emerald-500' : 
               clinic.status === 'negative' ? 'bg-red-500' : 'bg-amber-500'
             }`}>
               {clinic.status === 'positive' ? 'Olumlu' : clinic.status === 'negative' ? 'Olumsuz' : 'İletişimde'}
             </div>
           )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 leading-tight mb-2 line-clamp-1">{clinic.name}</h3>
        
        <div className="space-y-2 text-[11px] text-slate-600 mb-4">
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <i className="fas fa-phone-alt text-emerald-500"></i>
              <span className="font-black text-slate-700">{clinic.phone || 'Telefon Yok'}</span>
            </div>
            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                <i className="fas fa-phone"></i>
              </a>
            )}
          </div>
          <div className="flex items-start gap-2 px-2">
            <i className="fas fa-map-marker-alt text-blue-500 mt-0.5"></i>
            <span className="line-clamp-2">{clinic.district}, {clinic.city}</span>
          </div>
        </div>

        {/* Not Alanı */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea 
                className="w-full p-2 text-[10px] border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Arama notu ekleyin..."
                rows={2}
                value={clinic.notes}
                onChange={(e) => onUpdateNote(clinic.id, e.target.value)}
                autoFocus
              />
              <button onClick={() => setShowNoteInput(false)} className="w-full text-[9px] font-bold text-blue-600 text-right uppercase">Notu Kaydet</button>
            </div>
          ) : (
            <div 
              onClick={() => setShowNoteInput(true)}
              className="p-2 bg-yellow-50/50 rounded-lg border border-yellow-100 min-h-[40px] cursor-pointer hover:bg-yellow-50 transition-all"
            >
              <p className="text-[10px] text-slate-500 italic">
                {clinic.notes || 'Buraya not eklemek için tıklayın (örn: cevap vermedi)...'}
              </p>
            </div>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="mt-4 flex flex-wrap gap-2">
          {clinic.status === 'none' ? (
            <button 
              onClick={() => onUpdateStatus(clinic.id, 'contacted')}
              className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"
            >
              <i className="fas fa-comment-dots"></i> İLETİŞİM KURULDU
            </button>
          ) : (
            <div className="w-full flex gap-2">
              <button 
                onClick={() => onUpdateStatus(clinic.id, 'positive')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${clinic.status === 'positive' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                OLUMLU
              </button>
              <button 
                onClick={() => onUpdateStatus(clinic.id, 'negative')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${clinic.status === 'negative' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                OLUMSUZ
              </button>
              <button onClick={() => onUpdateStatus(clinic.id, 'none')} className="bg-slate-100 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600">
                <i className="fas fa-undo"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
