
import React, { useState, useEffect, useMemo } from 'react';
import { DentalClinic, PageMode } from './types';
import { fetchDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import ClinicList from './components/ClinicList';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>(() => {
    try {
      const saved = localStorage.getItem('dental_sync_v14');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [pageMode, setPageMode] = useState<PageMode>('HOME');
  const [selectedCityFolder, setSelectedCityFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'CARD' | 'LIST'>('CARD');

  useEffect(() => {
    localStorage.setItem('dental_sync_v14', JSON.stringify(clinics));
  }, [clinics]);

  const saveApiKey = () => {
    if (manualKey.trim().length > 10) {
      localStorage.setItem('DENTAL_MAP_SECRET_KEY', manualKey.trim());
      setError(null);
      window.location.reload();
    }
  };

  const handleSearch = async () => {
    if (!citySearch.trim()) return;
    setIsLoading(true);
    setError(null);
    setStatusMessage(`${citySearch} taranıyor...`);
    
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
        },
        (status) => setStatusMessage(status)
      );
      setCitySearch('');
    } catch (err: any) {
      if (err.message === "API_KEY_REQUIRED") setError("API_KEY_REQUIRED");
      else alert(err.message);
    } finally {
      setIsLoading(false);
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

  if (error === "API_KEY_REQUIRED") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full space-y-8 bg-slate-800/50 p-10 rounded-[2.5rem] shadow-2xl border border-white/10 backdrop-blur-xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40">
              <i className="fas fa-key text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Sistem Kilidi</h2>
            <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest leading-none text-center">API Kotası veya Anahtarı Hatası</p>
          </div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Gemini API Key..." 
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-center"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
            />
            <button onClick={saveApiKey} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
              Anahtarı Kaydet ve Başlat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex h-screen overflow-hidden font-sans text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0F172A] text-white transition-all duration-300 flex flex-col shrink-0 z-30 shadow-2xl`}>
        <div className="p-4 h-12 border-b border-white/5 flex items-center justify-between">
          {isSidebarOpen && <span className="font-macondo font-black text-blue-400 text-xl tracking-tight">dentalMap</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:text-white transition-colors">
            <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-hide">
          <button onClick={() => {setPageMode('HOME'); setSelectedCityFolder(null)}} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${pageMode === 'HOME' && !selectedCityFolder ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
            <i className="fas fa-home w-4 text-sm"></i>
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Ana Sayfa</span>}
          </button>

          <div className="space-y-1">
            <div className={`px-4 mb-2 ${!isSidebarOpen && 'text-center'}`}>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{isSidebarOpen ? 'ŞEHİR LİSTELERİ' : 'ŞEHİR'}</span>
            </div>
            {cityGroups.map(([city, count]) => (
              <button key={city} onClick={() => {setPageMode('CITY_LISTS'); setSelectedCityFolder(city)}} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${selectedCityFolder === city ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
                <div className="flex items-center gap-3 truncate">
                  <i className="fas fa-folder text-blue-500 text-xs"></i>
                  {isSidebarOpen && <span className="text-[10px] font-bold uppercase truncate">{city}</span>}
                </div>
                {isSidebarOpen && <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md">{count}</span>}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className={`px-4 mb-2 ${!isSidebarOpen && 'text-center'}`}>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{isSidebarOpen ? 'CRM DURUMU' : 'CRM'}</span>
            </div>
            <button onClick={() => setPageMode('CONVERSATIONS_POSITIVE')} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_POSITIVE' ? 'bg-emerald-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
              <div className="flex items-center gap-3">
                <i className="fas fa-smile text-xs"></i>
                {isSidebarOpen && <span className="text-[10px] font-bold uppercase">Olumlu</span>}
              </div>
              {isSidebarOpen && <span className="text-[8px] font-black">{stats.positive}</span>}
            </button>
            <button onClick={() => setPageMode('CONVERSATIONS_NEGATIVE')} className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${pageMode === 'CONVERSATIONS_NEGATIVE' ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}>
              <div className="flex items-center gap-3">
                <i className="fas fa-frown text-xs"></i>
                {isSidebarOpen && <span className="text-[10px] font-bold uppercase">Olumsuz</span>}
              </div>
              {isSidebarOpen && <span className="text-[8px] font-black">{stats.negative}</span>}
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-4 shrink-0 z-20 shadow-sm">
          {!isSidebarOpen && <span className="font-macondo font-black text-blue-600 text-lg tracking-tight shrink-0">dentalMap</span>}
          <div className="flex-1 max-w-xl relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
            <input 
              type="text" 
              placeholder="Şehir veya ilçe ara..." 
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-1 rounded-xl text-[10px] font-bold outline-none focus:border-blue-400 transition-all"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-600/10 disabled:opacity-50 transition-all">
            {isLoading ? <i className="fas fa-spinner animate-spin"></i> : 'ARA'}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
          {isLoading && (
            <div className="mb-4 bg-white p-3 rounded-2xl border border-blue-50 shadow-lg shadow-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm animate-pulse">
                  <i className="fas fa-satellite-dish"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-blue-900 font-black text-[9px] uppercase tracking-widest">Tarama Yapılıyor ({stats.total} Kayıt)</h4>
                  <p className="text-slate-400 text-[9px] font-bold uppercase mt-0.5">{statusMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
            <div>
              <h1 className="text-lg font-black text-[#0F172A] tracking-tighter uppercase leading-none">
                {selectedCityFolder || "Panel"}
              </h1>
              <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1.5">{filteredClinics.length} Doktor Listeleniyor</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode(viewMode === 'CARD' ? 'LIST' : 'CARD')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                <i className={`fas ${viewMode === 'CARD' ? 'fa-list' : 'fa-th-large'} text-xs`}></i>
              </button>
              <button onClick={() => exportToExcel(filteredClinics)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all">
                <i className="fas fa-file-excel"></i> EXCEL
              </button>
            </div>
          </div>

          {viewMode === 'CARD' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClinics.map(clinic => (
                <ClinicCard 
                  key={clinic.id} 
                  clinic={clinic} 
                  onUpdateStatus={(id, s) => setClinics(prev => prev.map(c => c.id === id ? {...c, status: s} : c))} 
                  onUpdateNote={(id, n) => setClinics(prev => prev.map(c => c.id === id ? {...c, notes: n} : c))} 
                />
              ))}
            </div>
          ) : (
            <ClinicList clinics={filteredClinics} onUpdateStatus={(id, s) => setClinics(prev => prev.map(c => c.id === id ? {...c, status: s} : c))} />
          )}
        </main>

        <footer className="h-10 bg-white border-t border-slate-100 flex items-center justify-between px-4 shrink-0 shadow-inner">
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-black text-slate-500">Olumlu: <span className="text-emerald-600">{stats.positive}</span></span>
            <span className="text-[8px] font-black text-slate-500">İletişim: <span className="text-lime-600">{stats.contacted}</span></span>
            <span className="text-[8px] font-black text-slate-500">Olumsuz: <span className="text-red-600">{stats.negative}</span></span>
          </div>
          <div className="text-right leading-tight">
            <p className="text-[7px] text-slate-400 font-medium italic">Hastanın doktora ulaşmasını kolaylaştırmak amacıyla hazırlanmıştır. Tüm haklar saklıdır © 2026</p>
            <p className="text-[8px] font-black text-[#0F172A] uppercase tracking-tighter">
              Enes YILMAZ tarafından hazırlanmıştır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
