
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

// Always use named parameter for apiKey and obtain from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const searchOnMaps = async (query: string): Promise<DentalClinic[]> => {
  try {
    // Using gemini-2.5-flash as it supports googleMaps tool
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: `Google Haritalar (Google Maps) verilerini kullanarak şu spesifik sorgu için tüm işletmeleri listele: "${query}". 
      Lütfen sadece gerçek işletmeleri şu JSON yapısında döndür: 
      [{"name": "...", "phone": "...", "address": "...", "city": "...", "district": "...", "website": "...", "rating": 4.5, "userRatingsTotal": 120, "mapsUri": "..."}]`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    // The response.text property directly returns the string output.
    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Sorgu hatası:", query, error);
  }
  return [];
};

/**
 * Kullanıcının girdiği şehre ait ilçeleri ve arama terimlerini zenginleştiren yapı.
 */
export const fetchDentalClinics = async (
  location: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  const baseCategories = [
    "diş hekimi", 
    "diş hastanesi", 
    "dental klinik", 
    "özel diş polikliniği", 
    "ağız ve diş sağlığı merkezi"
  ];

  const malatyaDistricts = [
    "Yeşilyurt", "Battalgazi", "Doğanşehir", "Darende", "Akçadağ", 
    "Hekimhan", "Pütürge", "Yazıhan", "Arapgir", "Arguvan", "Kuluncak", "Kale", "Doğanyol"
  ];

  let targetQueries: string[] = [];

  const isMalatyaSearch = location.toLowerCase().includes("malatya");

  if (isMalatyaSearch) {
    malatyaDistricts.forEach(district => {
      baseCategories.forEach(cat => {
        targetQueries.push(`Malatya ${district} ${cat}`);
      });
    });
  } else {
    baseCategories.forEach(cat => {
      targetQueries.push(`${location} ${cat}`);
    });
  }

  if (onProgress) onProgress(`${location} için derinlemesine ilçe taraması başlatıldı (${targetQueries.length} farklı sorgu)...`);

  for (let i = 0; i < targetQueries.length; i++) {
    const query = targetQueries[i];
    if (onProgress) onProgress(`Tarama yapılıyor (${i + 1}/${targetQueries.length}): "${query}"`);
    
    const results = await searchOnMaps(query);
    
    if (results.length > 0) {
      onNewData(results.map((r, idx) => ({
        ...r,
        id: `maps-${Date.now()}-${Math.random()}-${idx}`
      })));
    }
    
    await delay(1200);
    
    if ((i + 1) % 10 === 0 && onProgress) {
      onProgress(`Kapsamlı tarama devam ediyor... Şuna kadar ${i + 1} bölge tarandı.`);
    }
  }
  
  if (onProgress) onProgress("Bütün ilçeler ve kategoriler tarandı. Toplam liste hazır.");
};
