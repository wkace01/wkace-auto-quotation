
import * as XLSX from 'xlsx';
import { ProcessingRow, ColumnConfig } from '../types';

/**
 * CSV에서 주소 목록 파싱
 */
export async function parseAddressesFromFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // A열(주소) 데이터만 추출
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const addresses = jsonData
          .slice(1) // 헤더 제외
          .map(row => row[0]) // 첫 번째 컬럼
          .filter(addr => addr && typeof addr === 'string' && addr.trim().length > 0);
          
        resolve(addresses);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/**
 * 결과 엑셀 파일 생성 및 다운로드
 */
export function downloadResults(rows: ProcessingRow[], config: ColumnConfig[]) {
  const enabledColumns = config
    .filter(c => c.enabled)
    .sort((a, b) => a.order - b.order);
    
  const exportData = rows.map(row => {
    const data: any = {};
    enabledColumns.forEach(col => {
      if (col.key === 'originalAddress') data[col.label] = row.originalAddress;
      else if (col.key === '상태') data[col.label] = row.status === 'success' ? '완료' : row.message || '대기';
      else if (col.key === 'message') {
        const info = row.buildingData?.['_info'];
        data[col.label] = [row.message, info].filter(Boolean).join(' / ') || (row.status === 'error' ? '건물 정보 없음' : '');
      } else if (row.addressData && col.key in row.addressData) {
        data[col.label] = (row.addressData as any)[col.key];
      } else if (row.buildingData && col.key in row.buildingData) {
        let val = row.buildingData[col.key];
        if (col.key === '사용승인일' && val && val.length === 8) {
          val = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
        } else if (['연면적', '부속건축물면적', '대지면적', '건축면적', '총연면적'].includes(col.key) && val) {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            val = num.toFixed(2);
          }
        }
        data[col.label] = val;
      } else {
        data[col.label] = '';
      }
    });
    return data;
  });
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "조회결과");
  
  XLSX.writeFile(workbook, `건축물대장_조회결과_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * 양식 파일 생성 및 다운로드
 */
export function downloadTemplate() {
  const data = [
    ["주소", "참고사항"],
    ["강원특별자치도 원주시 소초면 북원로 3223", "예시 데이터"],
    ["서울특별시 강남구 언주로 840", "예시 데이터"]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "양식");
  
  XLSX.writeFile(workbook, "건축물대장_조회_양식.xlsx");
}
