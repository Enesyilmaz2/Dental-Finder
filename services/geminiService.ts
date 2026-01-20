
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

  // Kota dostu arama adımları
  const searchSteps = [
    { query: `${location} en popüler diş klinikleri ve hastaneleri`, label: "Ana Merkezler" },
    { query: `${location} özel diş hekimi muayenehaneleri listesi`, label: "Muayenehaneler" },
    { query: `${location} ağız ve diş sağlığı poliklinikleri rehberi`, label: "Poliklinikler" }
  ];

  for (let i = 0; i < searchSteps.length; i++) {
    const step = searchSteps[i];
    if (onProgress) onProgress(`Arama Adımı ${i + 1}/${searchSteps.length}: ${step.label} taranıyor...`);

    const searchPrompt = `
      GÖREV: "${step.query}" sorgusu için Google ve Google Maps kaynaklı veri topla.
      HEDEF: En az 15-20 adet benzersiz kayıt bul.
      BİLGİLER:
      - Telefon: Varsa tüm numaraları (sabit ve cep) al.
      - Kaynak: Bilginin alındığı linki (Google Maps veya web sitesi) mutlaka ekle.
      
      ÇIKTI SADECE JSON:
      [{
        "name": "İsim",
        "phone": "Tel1 / Tel2",
        "address": "Adres",
        "city": "${location}",
        "district": "İlçe",
        "sourceLinks": [{"name": "Google Maps", "url": "https://..."}]
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
      console.error("Kota veya Ağ Hatası:", error);
      if (error.message?.includes("429") || error.message?.includes("quota")) {
        // Kota hatasında işlemi tamamen kesmek yerine bir sonraki adım için uzun bekleyebiliriz 
        // ama kullanıcıya bildirmek daha sağlıklı.
        if (onProgress) onProgress("Kota sınırı! 10 saniye bekleniyor...");
        await new Promise(r => setTimeout(r, 10000));
        continue; // Bir sonraki adımı dene
      }
    }
    
    // ÜCRETSİZ PLAN İÇİN KRİTİK: Her istek arası 2 saniye bekle
    if (i < searchSteps.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
};
