
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

const getAIInstance = () => {
  // Netlify ortam değişkenlerini doğrudan okuyabilir
  const apiKey = process.env.API_KEY || localStorage.getItem('DENTAL_MAP_SECRET_KEY');
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
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
  } catch (e) {
    throw new Error("API_KEY_REQUIRED");
  }

  if (onProgress) onProgress(`${location} bölgesi için derinlemesine Google Maps ve Web taraması yapılıyor...`);

  const searchPrompt = `
    GÖREV: "${location}" şehrindeki TÜM diş hekimlerini, diş kliniklerini ve diş hastanelerini bul. 
    İlçeleri (Örn: Yeşilyurt, Battalgazi, Konak vb.) tek tek tara. 
    HEDEF: Mümkün olduğunca çok (en az 80-100) kayıt bulmaya çalış.
    ÖZELLİKLE cep telefonlarını (05xx) ve güncel sabit hatları bul. 
    Aynı isimli olanları birleştir, farklı kaynaklardaki telefonları harmanla.
    
    ÇIKTI FORMATI: Sadece JSON listesi dön.
    [{
      "name": "Klinik Adı",
      "phone": "05xx..., 0422... (Tüm numaralar virgülle)",
      "address": "Tam Adres",
      "city": "${location}",
      "district": "İlçe Adı",
      "sourceLinks": [{"name": "Google Maps", "url": "https://maps.google.com/..."}]
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
      onNewData(results.map((r: any, idx: number) => ({
        ...r,
        id: `dent-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        status: 'none',
        notes: '',
        sources: r.sourceLinks?.map((s: any) => s.name) || ["Google"]
      })));
    }
  } catch (error: any) {
    console.error("Fetch Error:", error);
    throw new Error("Tarama işlemi başarısız. API anahtarını veya internet bağlantınızı kontrol edin.");
  }
};
