
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY okunamadı. Vercel Settings > Environment Variables kısmında API_KEY tanımlı olmalı ve mutlaka REDEPLOY yapılmalıdır.");
    return null;
  }
  
  return new GoogleGenAI({ apiKey });
};

const searchOnMaps = async (query: string): Promise<DentalClinic[]> => {
  try {
    const ai = getAIInstance();
    if (!ai) {
      throw new Error("API anahtarı eksik! Vercel Settings > Environment Variables kısmına API_KEY eklemeli ve ardından Deployments sekmesinden REDEPLOY yapmalısınız.");
    }

    // Google Maps tool'u şu an gemini-2.5 serisinde aktiftir.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Google Haritalar verilerini kullanarak "${query}" araması için aktif diş hekimi ve kliniklerini listele. 
      Yanıtı SADECE aşağıdaki JSON formatında ver:
      [{"name": "...", "phone": "...", "address": "...", "city": "...", "district": "...", "website": "...", "rating": 5, "userRatingsTotal": 10, "mapsUri": "..."}]`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error: any) {
    console.error("Arama Hatası:", error);
    throw new Error(error.message || "Arama sırasında bir hata oluştu.");
  }
};

export const fetchDentalClinics = async (
  location: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  const query = `${location} diş hekimleri`;
  if (onProgress) onProgress(`${location} için veriler toplanıyor...`);

  try {
    const results = await searchOnMaps(query);
    if (results && results.length > 0) {
      onNewData(results.map((r, idx) => ({
        ...r,
        id: `dent-${Date.now()}-${idx}`,
        status: 'none',
        notes: ''
      })));
    } else {
      if (onProgress) onProgress("Sonuç bulunamadı.");
    }
  } catch (e: any) {
    throw e;
  }
};
