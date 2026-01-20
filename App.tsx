
import React, { useState, useEffect, useMemo } from 'react';
import { DentalClinic, ViewMode, PageMode } from './types';
import { fetchDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import ClinicList from './components/ClinicList';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>(() => {
    const saved = localStorage.getItem('dental_sync_v3');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARD);
  const [pageMode, setPageMode] = useState<PageMode>('HOME');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [selectedCityFolder, setSelectedCityFolder] = useState<string | null>(null);
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  useEffect(() => {
    localStorage.setItem('dental_sync_v3', JSON.stringify(clinics));
  }, [clinics]);

  const updateStatus = (id: string, status: DentalClinic['status']) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateNote = (id: string, notes: string) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const updateClinics = (newClinics: DentalClinic[]) => {
    setClinics(prev => {
      const combined = [...prev];
      newClinics.forEach(item => {
        const nameKey = item.name.toLowerCase().trim();
        const phoneKey = item.phone ? item.phone.replace(/\s/g, '') : 'no-phone';
        const exists = combined.some(c => 
          (c.name.toLowerCase().trim() === nameKey) || 
          (c.phone && c.phone.replace(/\s/g, '') === phoneKey && phoneKey !== 'no-phone')
        );
        if (!exists) combined.push({ ...item, status: 'none', notes: '' });
      });
      return combined;
    });
  };

  // Fixed missing handleSearch function
  const handleSearch = async () => {
    if (!citySearch.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await fetchDentalClinics(
        citySearch,
        (newData) => updateClinics(newData),
        (status) => setStatusMessage(status)
      );
      setCitySearch('');
    } catch (err) {
      setError('Arama sırasında bir hata oluştu.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          setClinics(data);
          alert("Veriler başarıyla yüklendi!");
        }
      } catch (err) {
        alert("Geçersiz dosya formatı.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(clinics));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dental_backup_${new Date().toLocaleDateString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const cityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    clinics.forEach(c => {
      const city = c.city || 'Diğer';
      stats[city] = (stats[city] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [clinics]);

  const filteredClinics = useMemo(() => {
    if (pageMode === 'HOME') return clinics;
    if (pageMode === 'CONVERSATIONS_POSITIVE') return clinics.filter(c => c.status === 'positive');
    if (pageMode === 'CONVERSATIONS_NEGATIVE') return clinics.filter(c => c.status === 'negative');
    if (pageMode === 'CITY_LISTS') return clinics.filter(c => c.city === selectedCityFolder);
    return clinics;
  }, [clinics, pageMode, selectedCityFolder]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans overflow-hidden">
      {showSyncPanel && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4">Veri Transferi (Cihaz Değiştirme)</h3>
            <p className="text-sm text-slate-500 mb-6">Bilgisayardan Telefona veri taşımak için önce 'Yedek Al' yapın, sonra o dosyayı telefonda 'Yükle' deyin.</p>
            <div className="space-y-4">
              <button onClick={handleExportJson} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3">
                <i className="fas fa-download"></i> TÜM VERİYİ YEDEK AL (JSON)
              </button>
              <label className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-slate-300">
                <i className="fas fa-upload"></i> YEDEK DOSYASI YÜKLE
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
            <button onClick={() => setShowSyncPanel(false)} className="mt-8 w-full text-slate-400 font-bold py-2">Kapat</button>
          </div>
        </div>
      )}

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0 md:w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0 z-50 overflow-hidden`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between h-16">
          {isSidebarOpen && <div className="font-black text-xl tracking-tighter">DENTAL<span className="text-blue-500">MAP</span></div>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg ml-auto">
            <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <button onClick={() => setPageMode('HOME')} className={`w-full flex items-center gap-4 px-6 py-3 transition-all ${pageMode === 'HOME' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <i className="fas fa-home w-5"></i>
            {isSidebarOpen && <span className="font-bold text-sm">Tüm Rehber ({clinics.length})</span>}
          </button>

          <div className="mt-6 px-6 mb-2">
            {isSidebarOpen && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Görüşmelerim</span>}
          </div>
          <button onClick={() => setPageMode('CONVERSATIONS_POSITIVE')} className={`w-full flex items-center gap-4 px-6 py-3 transition-all ${pageMode === 'CONVERSATIONS_POSITIVE' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}>
            <i className="fas fa-check-circle w-5"></i>
            {isSidebarOpen && <span className="font-bold text-sm">Olumlu Sonuçlar</span>}
          </button>
          <button onClick={() => setPageMode('CONVERSATIONS_NEGATIVE')} className={`w-full flex items-center gap-4 px-6 py-3 transition-all ${pageMode === 'CONVERSATIONS_NEGATIVE' ? 'bg-red-600/20 text-red-400' : 'text-slate-400 hover:bg-slate-800'}`}>
            <i className="fas fa-times-circle w-5"></i>
            {isSidebarOpen && <span className="font-bold text-sm">Olumsuz Sonuçlar</span>}
          </button>

          <div className="mt-6 px-6 mb-2 border-t border-slate-800 pt-6">
            {isSidebarOpen && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Yedeklenen İller</span>}
          </div>
          <div className="space-y-1">
            {cityStats.map(([city, count]) => (
              <button key={city} onClick={() => { setPageMode('CITY_LISTS'); setSelectedCityFolder(city); }} className={`w-full flex items-center justify-between px-6 py-2.5 transition-all ${pageMode === 'CITY_LISTS' && selectedCityFolder === city ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                <div className="flex items-center gap-4 overflow-hidden">
                  <i className="fas fa-folder w-5 shrink-0 text-blue-500/50"></i>
                  {isSidebarOpen && <span className="text-sm truncate font-medium">{city}</span>}
                </div>
                {isSidebarOpen && <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setShowSyncPanel(true)} className="w-full py-3 bg-slate-800 hover:bg-blue-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
             <i className="fas fa-sync-alt"></i> {isSidebarOpen ? 'CİHAZLAR ARASI TAŞI' : ''}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 py-3 px-4 md:px-8 shadow-sm z-40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
            <form onSubmit={async (e) => { e.preventDefault(); if(!isLoading) await handleSearch(); }} className="flex-1 w-full max-w-xl relative">
              <input type="text" placeholder="Yeni İl Ara ve Rehbere Ekle..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <button type="submit" disabled={isLoading} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700">
                {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'ARA / EKLE'}
              </button>
            </form>
            <div className="flex gap-2">
              <button onClick={() => setViewMode(viewMode === ViewMode.CARD ? ViewMode.LIST : ViewMode.CARD)} className="p-3 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-all"><i className={`fas ${viewMode === ViewMode.CARD ? 'fa-list' : 'fa-th-large'}`}></i></button>
              <button onClick={() => exportToExcel(filteredClinics)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-100"><i className="fas fa-file-excel"></i> EXCEL</button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                {pageMode === 'HOME' ? 'TÜM REHBERİM' : selectedCityFolder || 'LİSTE'}
                <span className="text-sm font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{filteredClinics.length} Kayıt</span>
              </h2>
              {statusMessage && <div className="text-[10px] font-black text-blue-600 animate-pulse bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 uppercase">{statusMessage}</div>}
              {error && <div className="text-[10px] font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 uppercase">{error}</div>}
            </div>

            {filteredClinics.length > 0 ? (
              viewMode === ViewMode.CARD ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                  {filteredClinics.map(clinic => <ClinicCard key={clinic.id} clinic={clinic} onUpdateStatus={updateStatus} onUpdateNote={updateNote} />)}
                </div>
              ) : (
                <ClinicList clinics={filteredClinics} onUpdateStatus={updateStatus} />
              )
            ) : (
              <div className="py-32 text-center opacity-40"><i className="fas fa-folder-open text-6xl mb-4"></i><p className="font-bold text-slate-500 uppercase tracking-tighter">Henüz veri yok</p></div>
            )}
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 px-8 text-center">
          <p className="text-[10px] font-bold text-slate-400">© 2026 DENTALMAP • Enes YILMAZ Sosyal Fayda Projesi</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
