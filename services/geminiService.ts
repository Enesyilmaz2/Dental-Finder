
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

// API anahtarını güvenli bir şekilde al
const getAIInstance = () => {
  // Vercel bazen süreci hızlandırmak için değişkenleri farklı şekillerde sunabilir
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
    throw new Error("API_KEY_NOT_FOUND");
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
    throw new Error("⚠️ SİSTEM HATASI: API Anahtarı Bulunamadı! \n\nÇözüm: \n1. Vercel Settings > Environment Variables kısmına API_KEY eklediğinizden emin olun.\n2. Değişikliği yaptıktan sonra Deployments sekmesine gidip REDEPLOY yapın.");
  }

  if (onProgress) onProgress(`${location} bölgesi taranıyor. Google Maps ve yerel rehberler analiz ediliyor...`);

  const searchPrompt = `
    GÖREV: "${location}" bölgesindeki TÜM diş hekimlerini, diş hastanelerini ve kliniklerini bul.
    HEDEF: En az 80-100 arası benzersiz kayıt.
    DETAY: İlçeleriyle birlikte derinlemesine tara. Cep telefonlarına (GSM) öncelik ver.
    JSON FORMATI:
    [{
      "name": "Klinik Adı",
      "phone": "Numaralar",
      "address": "Adres",
      "city": "Şehir",
      "district": "İlçe",
      "sourceLinks": [{"name": "Google Maps", "url": "link"}]
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
        sources: r.sourceLinks?.map((s: any) => s.name) || []
      })));
    }
  } catch (error: any) {
    console.error("Fetch Error:", error);
    throw new Error("Arama yapılamadı. API limitine takılmış olabilir veya anahtar geçersizdir.");
  }
};
