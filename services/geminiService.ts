
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

const getAIInstance = () => {
  const envKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
  const manualKey = localStorage.getItem('DENTAL_MAP_SECRET_KEY');
  const apiKey = envKey || manualKey;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "") {
    throw new Error("API_KEY_REQUIRED");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const fetchDentalClinics = async (
  location: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  let ai;
  try {
    ai = getAIInstance();
  } catch (e: any) {
    throw new Error("API_KEY_REQUIRED");
  }

  // Arama stratejisi: Birden fazla adımda derinlemesine arama
  const searchSteps = [
    `${location} tüm diş klinikleri listesi`,
    `${location} özel diş hekimleri muayenehaneleri`,
    `${location} diş hastaneleri ve ağız sağlığı merkezleri`
  ];

  for (let i = 0; i < searchSteps.length; i++) {
    if (onProgress) onProgress(`Arama Adımı ${i + 1}/${searchSteps.length}: ${searchSteps[i]}`);

    const searchPrompt = `
      GÖREV: "${searchSteps[i]}" sorgusu için Google ve Google Maps verilerini kullanarak kapsamlı bir liste oluştur.
      KRİTERLER:
      - Mümkün olduğunca çok (en az 20 adet) farklı kayıt bul.
      - Telefon numaralarını (sabit ve özellikle 05xx ile başlayan cep numaralarını) mutlaka dahil et.
      - Her kayıt için verinin alındığı orijinal linki (Google Maps linki veya web sitesi) "sourceLinks" içine ekle.
      
      ÇIKTI FORMATI: Sadece JSON listesi döndür.
      [{
        "name": "Klinik/Hekim Adı",
        "phone": "0212... / 0532...",
        "address": "Tam Adres",
        "city": "${location}",
        "district": "İlgili İlçe",
        "sourceLinks": [{"name": "Kaynak Adı", "url": "Link"}]
      }]
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        }
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        const formattedResults = results.map((r: any, idx: number) => ({
          ...r,
          id: `dent-${Date.now()}-${idx}-${i}`,
          status: 'none',
          notes: '',
          sources: r.sourceLinks?.map((s: any) => s.name) || ["Google Search"]
        }));
        onNewData(formattedResults);
      }
    } catch (error: any) {
      console.error("Adım Hatası:", error);
      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error("API Kotası Doldu. Lütfen bir süre bekleyip tekrar deneyin veya ücretli plana geçiş yapın.");
      }
    }
    
    // API'yi yormamak için kısa bir bekleme
    if (i < searchSteps.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
};
