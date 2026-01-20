
import React, { useState, useEffect, useMemo } from 'react';
import { DentalClinic, ViewMode, PageMode } from './types';
import { fetchDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import ClinicList from './components/ClinicList';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>(() => {
    try {
      const saved = localStorage.getItem('dental_sync_v3');
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
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  useEffect(() => {
    localStorage.setItem('dental_sync_v3', JSON.stringify(clinics));
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
      console.error(err);
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const filteredClinics = useMemo(() => {
    if (pageMode === 'HOME') return clinics;
    if (pageMode === 'CITY_LISTS') return clinics.filter(c => c.city === selectedCityFolder);
    return clinics;
  }, [clinics, pageMode, selectedCityFolder]);

  const cityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    clinics.forEach(c => {
      const city = c.city || 'Diğer';
      stats[city] = (stats[city] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [clinics]);

  return (
    <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col shrink-0`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {isSidebarOpen && <span className="font-black">DENTALMAP</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded">
            <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          <button onClick={() => setPageMode('HOME')} className={`w-full text-left p-2 rounded ${pageMode === 'HOME' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <i className="fas fa-home mr-2"></i> {isSidebarOpen && "Anasayfa"}
          </button>
          <div className="text-[10px] text-slate-500 font-bold uppercase">Klasörler</div>
          {cityStats.map(([city, count]) => (
            <button key={city} onClick={() => { setPageMode('CITY_LISTS'); setSelectedCityFolder(city); }} className="w-full text-left p-2 text-sm hover:bg-slate-800 rounded flex justify-between">
              <span><i className="fas fa-folder mr-2 text-blue-400"></i> {isSidebarOpen && city}</span>
              {isSidebarOpen && <span className="bg-slate-800 px-2 rounded-full text-[10px]">{count}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex gap-4">
          <input 
            type="text" 
            placeholder="Şehir veya İlçe yazın..." 
            className="flex-1 bg-slate-100 px-4 py-2 rounded-lg outline-none"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
          />
          <button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            {isLoading ? "Aranıyor..." : "ARA"}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-bold rounded">
              {error}
            </div>
          )}

          {statusMessage && <div className="mb-4 text-blue-600 font-bold text-sm animate-pulse">{statusMessage}</div>}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-black">{pageMode === 'HOME' ? 'TÜM REHBER' : selectedCityFolder}</h1>
            <button onClick={() => exportToExcel(filteredClinics)} className="bg-emerald-600 text-white px-4 py-2 rounded text-xs">Excel İndir</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map(clinic => (
              <ClinicCard 
                key={clinic.id} 
                clinic={clinic} 
                onUpdateStatus={(id, status) => setClinics(prev => prev.map(c => c.id === id ? {...c, status} : c))}
                onUpdateNote={(id, notes) => setClinics(prev => prev.map(c => c.id === id ? {...c, notes} : c))}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
