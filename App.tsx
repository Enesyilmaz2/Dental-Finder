
import React, { useState, useEffect, useMemo } from 'react';
import { DentalClinic, ViewMode, PageMode } from './types';
import { fetchDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>(() => {
    try {
      const saved = localStorage.getItem('dental_sync_v4');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [pageMode, setPageMode] = useState<PageMode>('HOME');
  const [selectedCityFolder, setSelectedCityFolder] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dental_sync_v4', JSON.stringify(clinics));
  }, [clinics]);

  const handleSearch = async () => {
    if (!citySearch.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await fetchDentalClinics(
        citySearch,
        (newData) => {
          setClinics(prev => {
            const combined = [...prev];
            newData.forEach(item => {
              const exists = combined.some(c => c.name.toLowerCase() === item.name.toLowerCase());
              if (!exists) combined.push({ ...item, status: 'none', notes: '' });
            });
            return combined;
          });
        },
        (status) => setStatusMessage(status)
      );
      setCitySearch('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const stats = useMemo(() => ({
    total: clinics.length,
    positive: clinics.filter(c => c.status === 'positive').length,
    negative: clinics.filter(c => c.status === 'negative').length,
    contacted: clinics.filter(c => c.status === 'contacted').length,
  }), [clinics]);

  const cityGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    clinics.forEach(c => {
      const city = c.city || 'Belirsiz';
      groups[city] = (groups[city] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    if (pageMode === 'HOME') return clinics;
    if (pageMode === 'CITY_LISTS') return clinics.filter(c => c.city === selectedCityFolder);
    if (pageMode === 'CONVERSATIONS_POSITIVE') return clinics.filter(c => c.status === 'positive');
    if (pageMode === 'CONVERSATIONS_NEGATIVE') return clinics.filter(c => c.status === 'negative');
    return clinics;
  }, [clinics, pageMode, selectedCityFolder]);

  return (
    <div className="min-h-screen bg-white flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0 z-20`}>
        <div className={`p-4 h-16 border-b border-slate-800 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen && (
            <span className="font-black text-blue-400 tracking-tighter text-lg animate-in fade-in duration-500">
              DENTALMAP
            </span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`}
          >
            <i className="fas fa-angle-left"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-hide">
          <div className="space-y-1">
            <button onClick={() => setPageMode('HOME')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${pageMode === 'HOME' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
              <i className="fas fa-home w-5 text-center"></i>
              {isSidebarOpen && <span className="text-sm font-medium">Anasayfa</span>}
            </button>
          </div>

          <div>
            <div className={`px-3 mb-2 flex items-center justify-between ${!isSidebarOpen && 'justify-center'}`}>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isSidebarOpen ? 'Listeler' : 'LST'}</span>
            </div>
            <div className="space-y-1">
              {cityGroups.map(([city, count]) => (
                <button 
                  key={city} 
                  onClick={() => { setPageMode('CITY_LISTS'); setSelectedCityFolder(city); }} 
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCityFolder === city && pageMode === 'CITY_LISTS' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <i className="fas fa-folder text-blue-400 w-5 text-center"></i>
                    {isSidebarOpen && <span className="text-sm truncate max-w-[120px]">{city}</span>}
                  </div>
                  {isSidebarOpen && <span className="text-[10px] font-bold bg-slate-700 px-2 py-0.5 rounded-full">{count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={`px-3 mb-2 flex items-center justify-between ${!isSidebarOpen && 'justify-center'}`}>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isSidebarOpen ? 'Görüşmeler' : 'GRŞ'}</span>
            </div>
            <div className="space-y-1">
              <button onClick={() => setPageMode('CONVERSATIONS_POSITIVE')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_POSITIVE' ? 'bg-emerald-600/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <i className="fas fa-smile w-5 text-center text-emerald-500"></i>
                  {isSidebarOpen && <span className="text-sm font-medium">Olumlu</span>}
                </div>
                {isSidebarOpen && <span className="text-[10px] font-bold opacity-70">{stats.positive}</span>}
              </button>
              <button onClick={() => setPageMode('CONVERSATIONS_NEGATIVE')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_NEGATIVE' ? 'bg-red-600/20 text-red-400' : 'hover:bg-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <i className="fas fa-frown w-5 text-center text-red-500"></i>
                  {isSidebarOpen && <span className="text-sm font-medium">Olumsuz</span>}
                </div>
                {isSidebarOpen && <span className="text-[10px] font-bold opacity-70">{stats.negative}</span>}
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-6 shrink-0">
          {!isSidebarOpen && (
            <span className="font-black text-blue-600 tracking-tighter text-lg shrink-0 animate-in slide-in-from-left-4 duration-300">
              DENTALMAP
            </span>
          )}
          
          <div className="flex-1 max-w-2xl relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Yeni şehir veya bölge ara..." 
              className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch} 
            disabled={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : "KEŞFET"}
          </button>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 flex items-center gap-3 text-blue-600 font-bold text-sm bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              {statusMessage}
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {pageMode === 'HOME' ? 'Tüm Diş Klinikleri' : 
                 pageMode === 'CITY_LISTS' ? selectedCityFolder :
                 pageMode === 'CONVERSATIONS_POSITIVE' ? 'Olumlu Görüşmeler' : 'Olumsuz Görüşmeler'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{filteredClinics.length} kayıt listeleniyor</p>
            </div>
            <button onClick={() => exportToExcel(filteredClinics)} className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <i className="fas fa-file-excel text-emerald-600"></i> Excel'e Aktar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredClinics.map(clinic => (
              <ClinicCard 
                key={clinic.id} 
                clinic={clinic} 
                onUpdateStatus={(id, status) => setClinics(prev => prev.map(c => c.id === id ? {...c, status} : c))}
                onUpdateNote={(id, notes) => setClinics(prev => prev.map(c => c.id === id ? {...c, notes} : c))}
              />
            ))}
            {filteredClinics.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                 <i className="fas fa-search-minus text-5xl mb-4 opacity-20"></i>
                 <p className="text-sm font-medium">Bu kategoride henüz bir kayıt bulunmuyor.</p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          {/* İstatistikler */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              TOPLAM: {stats.total}
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              OLUMLU: {stats.positive}
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              İLETİŞİM: {stats.contacted}
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              OLUMSUZ: {stats.negative}
            </div>
          </div>

          {/* Telif Hakkı ve Açıklama */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-1">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Hastaların doktorlara ulaşımını kolaylaştırmak amacıyla hazırlanmıştır.
            </p>
            <div className="text-[11px] font-semibold text-slate-600 flex flex-wrap items-center justify-center md:justify-end gap-x-2">
              <span className="font-bold text-slate-800">Tüm hakları saklıdır. © 2026</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:block"></span>
              <span className="font-black text-blue-600">Enes YILMAZ tarafından hazırlanmıştır.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
