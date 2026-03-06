
export interface ApiSettings {
  jusoApiKey: string;
  buildingApiKey: string;
}

export interface AddressInfo {
  sigunguCd: string;
  bjdongCd: string;
  bun: string;
  ji: string;
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  error?: string;
}

export interface BuildingInfo {
  [key: string]: string;
}

export interface ProcessingRow {
  id: number;
  originalAddress: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  addressData?: AddressInfo;
  buildingData?: BuildingInfo;
  rawBuildingData?: any[]; // 원본 API 응답 데이터 보관용
}

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
}
