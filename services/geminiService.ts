
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

const getAIInstance = () => {
  // Vercel/Netlify için 'import.meta.env' veya 'process.env' kontrolü
  // @ts-ignore
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

  if (onProgress) onProgress(`${location} bölgesi taranıyor...`);

  const searchPrompt = `
    GÖREV: "${location}" şehrindeki tüm diş hekimlerini, diş kliniklerini ve diş hastanelerini bul. 
    İlçeleri tek tek tara. En az 20-30 farklı kayıt bulmaya çalış.
    Telefon numaralarını (özellikle 05xx cep telefonlarını) bul.
    ÇIKTI FORMATI: Sadece JSON.
    [{
      "name": "Klinik Adı",
      "phone": "Telefon numaraları",
      "address": "Açık Adres",
      "city": "${location}",
      "district": "İlçe",
      "sourceLinks": [{"name": "Google Maps", "url": "https://maps.google.com"}]
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
        id: `dent-${Date.now()}-${idx}`,
        status: 'none',
        notes: '',
        sources: r.sourceLinks?.map((s: any) => s.name) || ["Google Search"]
      })));
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Eğer hata 404/403 ise API key kaynaklıdır
    if (error.message?.includes("not found") || error.message?.includes("key")) {
      localStorage.removeItem('DENTAL_MAP_SECRET_KEY');
      throw new Error("API_KEY_REQUIRED");
    }
    throw new Error("Tarama başarısız: " + (error.message || "Bilinmeyen hata"));
  }
};
