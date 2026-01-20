
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

// API anahtarını güvenli bir şekilde al, hata varsa fırlatma, sadece null dön
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const searchOnMaps = async (query: string): Promise<DentalClinic[]> => {
  try {
    const ai = getAIInstance();
    if (!ai) {
      throw new Error("API anahtarı eksik! Vercel Settings > Environment Variables kısmına API_KEY eklemelisiniz.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: `Google Haritalar (Google Maps) verilerini kullanarak şu spesifik sorgu için tüm işletmeleri listele: "${query}". 
      Lütfen sadece gerçek işletmeleri şu JSON yapısında döndür: 
      [{"name": "...", "phone": "...", "address": "...", "city": "...", "district": "...", "website": "...", "rating": 4.5, "userRatingsTotal": 120, "mapsUri": "..."}]`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error: any) {
    console.error("Sorgu hatası:", query, error);
    throw error;
  }
  return [];
};

export const fetchDentalClinics = async (
  location: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  const baseCategories = ["diş hekimi", "diş hastanesi", "dental klinik"];
  let targetQueries: string[] = [];
  
  baseCategories.forEach(cat => {
    targetQueries.push(`${location} ${cat}`);
  });

  if (onProgress) onProgress(`${location} için tarama başlatıldı...`);

  for (let i = 0; i < targetQueries.length; i++) {
    const query = targetQueries[i];
    try {
      const results = await searchOnMaps(query);
      if (results.length > 0) {
        onNewData(results.map((r, idx) => ({
          ...r,
          id: `maps-${Date.now()}-${Math.random()}-${idx}`
        })));
      }
    } catch (e: any) {
      throw e;
    }
    await delay(1000);
  }
};
