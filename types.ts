
export interface DentalClinic {
  id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  mapsUri?: string;
  status?: 'none' | 'contacted' | 'positive' | 'negative';
  notes?: string;
}

export enum ViewMode {
  CARD = 'CARD',
  LIST = 'LIST'
}

export type PageMode = 'HOME' | 'CONVERSATIONS_POSITIVE' | 'CONVERSATIONS_NEGATIVE' | 'CITY_LISTS';
