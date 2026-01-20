
import React, { useState, useEffect } from 'react';
import { DentalClinic, ViewMode } from './types';
import { fetchDentalClinics, fetchAllTurkeyDentalClinics } from './services/geminiService';
import ClinicCard from './components/ClinicCard';
import ClinicList from './components/ClinicList';
import { exportToExcel } from './utils/exportUtil';

const App: React.FC = () => {
  const [clinics, setClinics] = useState<DentalClinic[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARD);
  const [error, setError] = useState<string | null>(null);

  const updateClinics = (newClinics: DentalClinic[]) => {
    setClinics(prev => {
      const combined = [...prev, ...newClinics];
      const uniqueMap = new Map();
      combined.forEach(item => {
        const key = `${item.name.toLowerCase().trim()}_${item.phone.replace(/\D/g, '')}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      });
      return Array.from(uniqueMap.values());
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!citySearch.trim()) return;

    setClinics([]);
    setError(null);
    setIsLoading(true);
    setStatusMessage(`${citySearch} için sorgu hazırlanıyor...`);

    try {
      await fetchDentalClinics(citySearch, updateClinics, setStatusMessage);
    } catch (err: any) {
      setError("Bağlantı hatası: Gemini API yanıt vermedi. Lütfen bir süre sonra tekrar deneyin.");
    } finally {
      setIsLoading(false);
      // Mesajı biraz daha tutup sonra temizle
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleAllTurkeySearch = async () => {
    if (!confirm("Tüm Türkiye taraması 81 ili sırayla tarayacaktır. Ücretsiz API limiti nedeniyle işlem yavaş ilerleyebilir. Başlatılsın mı?")) return;
    
    setClinics([]);
    setError(null);
    setIsLoading(true);
    setStatusMessage('Büyük Tarama Başlatılıyor...');

    try {
      await fetchAllTurkeyDentalClinics(updateClinics, setStatusMessage);
    } catch (err: any) {
      setError("Mega tarama beklenmedik bir şekilde durdu.");
    } finally {
      setIsLoading(false);
      setStatusMessage('Tarama tamamlandı.');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-tooth text-xl"></i>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden md:block">
              Türkiye Diş Rehberi
            </h1>
          </div>

          <div className="flex-1 max-w-xl flex gap-2">
            <form onSubmit={handleSearch} className="relative flex-1 group">
              <input
                type="text"
                placeholder="Şehir (Örn: Malatya)..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-2 border-transparent rounded-full focus:ring-0 focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                ARA
              </button>
            </form>
            
            <button 
              onClick={handleAllTurkeySearch}
              disabled={isLoading}
              className={`bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0 disabled:bg-slate-400 flex items-center gap-2`}
            >
              <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-globe-europe'}`}></i>
              <span className="hidden sm:inline">TÜM TÜRKİYE</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setViewMode(viewMode === ViewMode.CARD ? ViewMode.LIST : ViewMode.CARD)}
              className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <i className={`fas ${viewMode === ViewMode.CARD ? 'fa-list-ul' : 'fa-th-large'} text-lg`}></i>
            </button>
            <button 
              onClick={() => exportToExcel(clinics)}
              disabled={clinics.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                clinics.length === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
              }`}
            >
              <i className="fas fa-file-excel"></i>
              <span className="hidden sm:inline">EXCEL</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {isLoading ? 'Veri Aranıyor...' : (clinics.length > 0 ? 'Arama Sonuçları' : 'Kapsamlı Diş Sağlığı Rehberi')}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                  <i className="fas fa-database mr-2"></i>
                  {clinics.length} Kayıt Listeleniyor
                </span>
                {statusMessage && (
                  <div className="flex items-center bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium border border-amber-100 shadow-sm transition-all duration-300">
                    <i className="fas fa-satellite-dish mr-2 animate-pulse"></i>
                    {statusMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 flex items-center gap-4 shadow-sm animate-bounce">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
            <div>
              <p className="font-bold">Bağlantı Sorunu</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {clinics.length > 0 ? (
          viewMode === ViewMode.CARD ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          ) : (
            <ClinicList clinics={clinics} />
          )
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center text-5xl mb-6">
                <i className="fas fa-hospital"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Henüz Bir Arama Yapılmadı</h3>
              <p className="text-slate-500 max-w-sm mt-3 text-lg px-4">
                Bir şehir girerek başlayın veya tüm Türkiye için otomatik taramayı tetikleyin.
              </p>
            </div>
          )
        )}

        {isLoading && clinics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 font-bold text-xl">{statusMessage || 'Veriler yükleniyor...'}</p>
            <p className="text-slate-400 text-sm mt-2 max-w-xs text-center px-4">
              Yapay zeka verileri analiz ediyor. Ücretsiz sürüm limitleri nedeniyle bu işlem bazen 30-40 saniye sürebilir.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
