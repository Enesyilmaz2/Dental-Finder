
import { GoogleGenAI } from "@google/genai";
import { DentalClinic } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const fetchDentalClinics = async (
  location: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY eksik! Lütfen Vercel ayarlarından API_KEY tanımlayın.");
  }

  if (onProgress) onProgress(`${location} için kapsamlı tarama yapılıyor. Kayıtlar parça parça işleniyor...`);

  const searchPrompt = `
    GÖREV: "${location}" bölgesindeki TÜM diş hekimlerini, diş hastanelerini ve kliniklerini bul.
    
    HEDEF: En az 80-100 arası benzersiz ve güncel kayıt. 
    Lütfen bölgeyi ilçeleriyle birlikte (Örn: ${location} merkez ve tüm ilçeler) derinlemesine tara.
    
    ÖNEMLİ KURALLAR:
    1. Sadece sabit hatları değil, mutlaka CEP TELEFONU (GSM - 05xx...) numaralarını da bul ve listele.
    2. Her kayıt için bilginin alındığı sayfanın URL'sini (sourceLinks) mutlaka ekle. 
    3. Farklı kaynaklardan (Google Maps, Google Arama) gelen aynı isimleri tek bir kayıtta birleştir.
    4. Fotoğraf URL'si ekleme.
    
    JSON FORMATI:
    [{
      "name": "Klinik/Hekim Adı",
      "phone": "0422... , 0532... (Virgülle tüm bulunan numaraları ekle)",
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
    throw new Error("Veri çekme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
  }
};
