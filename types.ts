
export interface DentalClinic {
  id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address?: string;
  source?: string;
}

export enum ViewMode {
  CARD = 'CARD',
  LIST = 'LIST'
}

export interface SearchParams {
  city: string;
  district?: string;
}
