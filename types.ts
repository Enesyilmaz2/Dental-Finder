
export interface SourceLink {
  name: string;
  url: string;
}

export interface DentalClinic {
  id: string;
  name: string;
  phone: string; // Virgülle ayrılmış birden fazla numara (sabit ve cep)
  city: string;
  district: string;
  address: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  mapsUri?: string;
  status: 'none' | 'contacted' | 'positive' | 'negative';
  notes: string;
  sources: string[]; // Kaynak isimleri
  sourceLinks?: SourceLink[]; // Tıklanabilir kaynak linkleri
}

export type PageMode = 'HOME' | 'CITY_LISTS' | 'CONVERSATIONS_POSITIVE' | 'CONVERSATIONS_NEGATIVE';
