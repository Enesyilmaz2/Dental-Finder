
import React, { useState, useEffect, useMemo } from 'react';
import { DentalClinic, PageMode } from './types';
import { fetchDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import ClinicList from './components/ClinicList';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>(() => {
    try {
      const saved = localStorage.getItem('dental_sync_v8');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [targetCount, setTargetCount] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [pageMode, setPageMode] = useState<PageMode>('HOME');
  const [selectedCityFolder, setSelectedCityFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'CARD' | 'LIST'>('CARD');

  useEffect(() => {
    localStorage.setItem('dental_sync_v8', JSON.stringify(clinics));
  }, [clinics]);

  const handleSearch = async () => {
    if (!citySearch.trim()) return;
    setIsLoading(true);
    setError(null);
    setProcessedCount(0);
    setTargetCount(100);
    
    try {
      await fetchDentalClinics(
        citySearch,
        (newData) => {
          setClinics(prev => {
            const combined = [...prev];
            newData.forEach(item => {
              const exists = combined.some(c => c.name.toLowerCase() === item.name.toLowerCase());
              if (!exists) combined.push(item);
            });
            return combined;
          });
          setProcessedCount(prev => Math.min(prev + newData.length, 100));
        },
        (status) => setStatusMessage(status)
      );
      setCitySearch('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      // İlerlemeyi sıfırlama, kullanıcı sonucu görsün
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
      const city = c.city || 'Genel';
      groups[city] = (groups[city] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    let list = clinics;
    if (pageMode === 'CITY_LISTS') list = clinics.filter(c => c.city === selectedCityFolder);
    else if (pageMode === 'CONVERSATIONS_POSITIVE') list = clinics.filter(c => c.status === 'positive');
    else if (pageMode === 'CONVERSATIONS_NEGATIVE') list = clinics.filter(c => c.status === 'negative');
    return list;
  }, [clinics, pageMode, selectedCityFolder]);

  const updateStatus = (id: string, status: DentalClinic['status']) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateNote = (id: string, notes: string) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex h-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] text-white transition-all duration-300 flex flex-col shrink-0 z-30 shadow-2xl`}>
        <div className={`p-4 h-12 border-b border-white/5 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen && <span className="font-macondo font-black text-blue-400 tracking-wider text-xl">dentalMap</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-all ${!isSidebarOpen && 'rotate-180'}`}>
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
          <button onClick={() => { setPageMode('HOME'); setSelectedCityFolder(null); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${pageMode === 'HOME' && !selectedCityFolder ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-white/5 text-slate-500'}`}>
            <i className="fas fa-home w-5 text-center text-sm"></i>
            {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Panel</span>}
          </button>

          <div className="space-y-1">
            <div className={`px-3 mb-1 flex items-center justify-between ${!isSidebarOpen && 'justify-center'}`}>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{isSidebarOpen ? 'Şehirler' : 'İller'}</span>
            </div>
            {cityGroups.map(([city, count]) => (
              <button key={city} onClick={() => { setPageMode('CITY_LISTS'); setSelectedCityFolder(city); }} className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${selectedCityFolder === city ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
                <div className="flex items-center gap-3">
                  <i className="fas fa-folder text-blue-500 w-5 text-center text-sm"></i>
                  {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-tight truncate">{city}</span>}
                </div>
                {isSidebarOpen && <span className="text-[8px] font-black bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-lg">{count}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className={`px-3 mb-1 flex items-center justify-between ${!isSidebarOpen && 'justify-center'}`}>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">CRM</span>
            </div>
            <button onClick={() => setPageMode('CONVERSATIONS_POSITIVE')} className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_POSITIVE' ? 'bg-emerald-500 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
              <i className="fas fa-smile w-5 text-center text-sm"></i>
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Olumlu</span>}
              {isSidebarOpen && <span className="text-[10px] font-black opacity-60 ml-auto">{stats.positive}</span>}
            </button>
            <button onClick={() => setPageMode('CONVERSATIONS_NEGATIVE')} className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_NEGATIVE' ? 'bg-red-500 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
              <i className="fas fa-frown w-5 text-center text-sm"></i>
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Olumsuz</span>}
              {isSidebarOpen && <span className="text-[10px] font-black opacity-60 ml-auto">{stats.negative}</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header - Küçültüldü */}
        <header className="h-12 bg-white border-b border-slate-100 flex items-center px-4 gap-4 shrink-0 z-20">
          {!isSidebarOpen && (
            <span className="font-macondo font-black text-blue-600 tracking-wider text-lg shrink-0">dentalMap</span>
          )}
          
          <div className="flex-1 max-w-xl relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Şehir ve ilçe detaylarıyla tarayın..." 
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-[11px] outline-none focus:border-blue-500 transition-all font-medium text-slate-800"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch} 
            disabled={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-[10px] font-black shadow-md shadow-blue-500/10 disabled:opacity-50 transition-all shrink-0 uppercase tracking-widest"
          >
            {isLoading ? <i className="fas fa-spinner animate-spin"></i> : "ARA"}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span className="text-[10px] font-black uppercase tracking-wide">{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="mb-6 bg-white p-4 rounded-2xl border border-blue-100 shadow-xl shadow-blue-500/5 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg animate-pulse">
                  <i className="fas fa-satellite-dish"></i>
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-end mb-1">
                     <h4 className="text-blue-900 font-black text-[11px] uppercase tracking-widest">Tarama devam ediyor...</h4>
                     <span className="text-blue-600 font-black text-xs">{processedCount} / {targetCount}</span>
                   </div>
                   <p className="text-blue-600/60 text-[9px] font-black uppercase tracking-widest line-clamp-1">{statusMessage}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-700 ease-out" 
                  style={{ width: `${Math.max(5, (processedCount/targetCount) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">
                {selectedCityFolder || (pageMode === 'HOME' ? 'Klinikler' : pageMode === 'CONVERSATIONS_POSITIVE' ? 'Olumlu' : 'Olumsuz')}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-0.5 w-6 bg-blue-600 rounded-full"></div>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">{filteredClinics.length} kayıt listelendi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-white border border-slate-100 p-0.5 rounded-xl flex shadow-sm">
                <button onClick={() => setViewMode('CARD')} className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'CARD' ? 'bg-[#0F172A] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                  <i className="fas fa-th-large text-xs"></i>
                </button>
                <button onClick={() => setViewMode('LIST')} className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-[#0F172A] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                  <i className="fas fa-list text-xs"></i>
                </button>
              </div>
              <button onClick={() => exportToExcel(filteredClinics)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 uppercase tracking-widest">
                <i className="fas fa-file-excel text-xs"></i> Excel Raporu
              </button>
            </div>
          </div>

          {viewMode === 'CARD' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4">
              {filteredClinics.map(clinic => (
                <ClinicCard key={clinic.id} clinic={clinic} onUpdateStatus={updateStatus} onUpdateNote={updateNote} />
              ))}
            </div>
          ) : (
            <ClinicList clinics={filteredClinics} onUpdateStatus={updateStatus} />
          )}
          
          {filteredClinics.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-32 text-slate-200">
              <i className="fas fa-search-minus text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-sm tracking-tight text-slate-300 uppercase">Veri bulunamadı</p>
              <p className="text-[10px] text-slate-400 mt-2">Lütfen farklı bir bölge ismi deneyin</p>
            </div>
          )}
        </main>

        {/* Footer - Kompakt Tasarım */}
        <footer className="bg-white border-t border-slate-100 px-4 py-2 shrink-0">
          <div className="flex flex-col gap-1.5 max-w-screen-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-bold text-slate-600">Toplam Olumlu: {stats.positive}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A3E635]"></div>
                <span className="text-[9px] font-bold text-slate-600">İletişim: {stats.contacted}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-bold text-slate-600">Olumsuz: {stats.negative}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center pt-1 border-t border-slate-50">
              <p className="text-[8px] text-slate-400 font-medium">
                Hastanın doktora ulaşmasını kolaylaştırmak amacıyla hazırlanmıştır. Tüm haklar saklıdır © 2026
              </p>
              <p className="text-[9px] font-black text-[#0F172A] mt-0.5 tracking-wider">
                <span className="text-blue-600">Enes YILMAZ</span> tarafından hazırlanmıştır.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
