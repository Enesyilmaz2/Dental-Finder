
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

// API anahtarını kontrol et ve başlat
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_MISSING");
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
    throw new Error("Sistem Yapılandırması Hatası: Vercel üzerinde API_KEY tanımlanmamış veya Redeploy yapılmamış. Lütfen Environment Variables ayarlarını kontrol edin.");
  }

  if (onProgress) onProgress(`${location} bölgesi taranıyor. Kayıtlar Google kaynakları üzerinden analiz ediliyor...`);

  const searchPrompt = `
    GÖREV: "${location}" bölgesindeki TÜM diş hekimlerini, diş hastanelerini ve kliniklerini bul.
    
    HEDEF: En az 80-100 arası benzersiz ve güncel kayıt. 
    Bölgeyi tüm ilçeleriyle birlikte (Örn: ${location} merkez ve ilçeler) derinlemesine tara.
    
    ÖNEMLİ KURALLAR:
    1. Sabit hatlarla birlikte mutlaka CEP TELEFONU (GSM - 05xx...) numaralarını da bul.
    2. Her kayıt için sourceLinks (kaynak URL) mutlaka ekle. 
    3. Farklı kaynaklardan gelen aynı isimleri birleştir.
    4. Fotoğraf ekleme.
    
    JSON FORMATI:
    [{
      "name": "Klinik/Hekim Adı",
      "phone": "0422... , 0532... (Virgülle tüm numaraları ekle)",
      "address": "Tam Adres",
      "city": "Şehir",
      "district": "İlçe",
      "sourceLinks": [{"name": "Google Maps", "url": "https://www.google.com/maps/..."}]
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
        sources: r.sourceLinks?.map((s: any) => s.name) || []
      })));
    }
  } catch (error: any) {
    console.error("Fetch Error:", error);
    throw new Error("Tarama işlemi sırasında bir hata oluştu. Lütfen bağlantınızı ve API limitlerinizi kontrol edin.");
  }
};
