
import { GoogleGenAI, Type } from "@google/genai";
import { DentalClinic } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const TURKEY_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const callGeminiWithRetry = async (prompt: string, schema: any, onProgress?: (s: string) => void): Promise<any> => {
  let retries = 0;
  const maxRetries = 5; 
  
  while (retries < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1, // Daha kararlı ve hızlı yanıt için
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Boş yanıt alındı");
      
      return JSON.parse(text);
    } catch (error: any) {
      retries++;
      const errorMsg = error.message?.toLowerCase() || "";
      
      if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit") || errorMsg.includes("exhausted")) {
        const waitTime = 20000 * retries; // 20sn, 40sn... beklet
        if (onProgress) onProgress(`Hız limitine takılındı. ${waitTime/1000} saniye bekleniyor... (${retries}/${maxRetries})`);
        await delay(waitTime);
      } else {
        console.warn("Küçük bir hata oluştu, tekrar deneniyor...", error);
        await delay(3000);
      }
    }
  }
  return [];
};

export const fetchAllTurkeyDentalClinics = async (
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress: (status: string) => void
) => {
  try {
    onProgress("Tarama motoru başlatılıyor...");
    await delay(1000);

    for (const city of TURKEY_CITIES) {
      onProgress(`${city} ili için veriler sorgulanıyor...`);
      
      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            city: { type: Type.STRING },
            district: { type: Type.STRING },
          },
          required: ["name", "phone", "city", "district"]
        }
      };

      // Daha küçük ve spesifik bir prompt, hızlı yanıt sağlar
      const prompt = `${city} ilindeki bilinen en önemli 15-20 diş kliniğini ve telefon numaralarını listele. JSON formatında city, district, name ve phone alanlarını doldur.`;

      const clinics = await callGeminiWithRetry(prompt, schema, onProgress);

      if (clinics && Array.isArray(clinics) && clinics.length > 0) {
        onNewData(clinics.map((c: any, i: number) => ({
          ...c,
          id: `tr-${city}-${Date.now()}-${i}-${Math.random()}`
        })));
        onProgress(`${city} için ${clinics.length} kayıt eklendi. Sıradaki ile geçiliyor...`);
      } else {
        onProgress(`${city} için kayıt bulunamadı veya limit aşıldı.`);
      }
      
      // Her il arası kota koruma molası
      await delay(5000);
    }
  } catch (error) {
    console.error("Kritik Tarama Hatası:", error);
    onProgress("Tarama durduruldu. Lütfen daha sonra tekrar deneyin.");
  }
};

export const fetchDentalClinics = async (
  city: string,
  onNewData: (clinics: DentalClinic[]) => void,
  onProgress?: (status: string) => void
) => {
  if (onProgress) onProgress(`${city} taranıyor, lütfen bekleyin...`);
  
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        phone: { type: Type.STRING },
        city: { type: Type.STRING },
        district: { type: Type.STRING },
      },
      required: ["name", "phone", "city", "district"]
    }
  };

  // Malatya gibi şehirlerde ilçeleri tek tek sormak yerine toplu ama sınırlı sayı isteyelim
  const prompt = `${city} şehrindeki tüm diş hastanelerini ve kliniklerini listele. Her ilçe için en az 5-10 örnek ver. Toplamda maksimum 40 kayıt olsun. JSON formatında dön.`;

  const clinics = await callGeminiWithRetry(prompt, schema, onProgress);

  if (clinics && Array.isArray(clinics) && clinics.length > 0) {
    onNewData(clinics.map((c: any, i: number) => ({ ...c, id: `${city}-${Date.now()}-${i}` })));
    if (onProgress) onProgress(`${clinics.length} kayıt başarıyla yüklendi.`);
  } else {
    if (onProgress) onProgress("Sonuç bulunamadı.");
  }
};
