
import { AddressInfo, BuildingInfo } from '../types';
import { BUILDING_FIELD_MAPPING } from '../constants';

/**
 * 주소 API 호출 (Juso.go.kr)
 */
export async function getAddressInfo(apiKey: string, keyword: string): Promise<AddressInfo> {
  const url = `https://www.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${apiKey}&currentPage=1&countPerPage=5&keyword=${encodeURIComponent(keyword)}&resultType=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('네트워크 응답이 정상이 아닙니다.');
    
    const data = await response.json();
    const common = data.results?.common;
    
    if (common?.errorCode !== '0') {
      return { sigunguCd: '', bjdongCd: '', bun: '', ji: '', roadAddr: '', jibunAddr: '', zipNo: '', error: common?.errorMessage || '주소 API 오류' };
    }
    
    const juso = data.results?.juso?.[0];
    if (!juso) {
      return { sigunguCd: '', bjdongCd: '', bun: '', ji: '', roadAddr: '', jibunAddr: '', zipNo: '', error: '검색된 주소가 없습니다.' };
    }
    
    const admCd = juso.admCd || '';
    return {
      sigunguCd: admCd.substring(0, 5),
      bjdongCd: admCd.substring(5),
      bun: juso.lnbrMnnm || '',
      ji: juso.lnbrSlno || '0',
      roadAddr: juso.roadAddr,
      jibunAddr: juso.jibunAddr,
      zipNo: juso.zipNo
    };
  } catch (error) {
    return { sigunguCd: '', bjdongCd: '', bun: '', ji: '', roadAddr: '', jibunAddr: '', zipNo: '', error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
}

/**
 * 건축물대장 API 호출 (apis.data.go.kr)
 */
export async function getBuildingRegistry(apiKey: string, sigunguCd: string, bjdongCd: string, bun: string, ji: string): Promise<{ processed: BuildingInfo, raw: any[] }> {
  const paddedBun = bun.padStart(4, '0');
  const paddedJi = ji.padStart(4, '0');
  
  const baseUrl = "https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo";
  const url = `${baseUrl}?serviceKey=${apiKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${paddedBun}&ji=${paddedJi}&numOfRows=100&pageNo=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API 호출 중 오류가 발생했습니다.');
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const totalCountStr = xmlDoc.getElementsByTagName('totalCount')[0]?.textContent;
    const totalCount = parseInt(totalCountStr || '0');
    
    if (totalCount === 0) {
      return { processed: { '상태': '데이터 없음' }, raw: [] };
    }
    
    const items = xmlDoc.getElementsByTagName('item');
    if (items.length === 0) {
      return { processed: { '상태': '조회된 건물 정보 없음' }, raw: [] };
    }
    
    const rawItems: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemObj: any = {};
      const children = item.children;
      for (let j = 0; j < children.length; j++) {
        itemObj[children[j].tagName] = children[j].textContent?.trim() || '';
      }
      rawItems.push(itemObj);
    }

    let sumMainTotArea = 0;
    let sumAnnexTotArea = 0;
    let mainItem: Element | null = null;
    let maxMainArea = -1;
    let maxAnyArea = -1;
    let fallbackItem = items[0];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const totArea = parseFloat(item.getElementsByTagName('totArea')[0]?.textContent || '0');
      
      // 사용자 규칙: mainAtchGbCdNm 필드 확인 (유사 필드 포함)
      const gbCdNm = item.getElementsByTagName('mainAtchGbCdNm')[0]?.textContent?.trim();
      const seCdNm = item.getElementsByTagName('mainAtchBldSeCdNm')[0]?.textContent?.trim();
      
      const isMain = gbCdNm === '주건축물' || seCdNm === '주건축물';
      const isAnnex = gbCdNm === '부속건축물' || seCdNm === '부속건축물';
      
      if (isMain) {
        sumMainTotArea += totArea;
        if (totArea > maxMainArea) {
          maxMainArea = totArea;
          mainItem = item;
        }
      } else if (isAnnex) {
        sumAnnexTotArea += totArea;
      }

      // 전체 중 가장 큰 것 (백업용)
      if (totArea > maxAnyArea) {
        maxAnyArea = totArea;
        fallbackItem = item;
      }
    }

    // Re-calculate land/building area from max values across all records
    let maxPlatArea = 0;
    let maxArchArea = 0;
    for (let i = 0; i < items.length; i++) {
      const plat = parseFloat(items[i].getElementsByTagName('platArea')[0]?.textContent || '0');
      const arch = parseFloat(items[i].getElementsByTagName('archArea')[0]?.textContent || '0');
      if (plat > maxPlatArea) maxPlatArea = plat;
      if (arch > maxArchArea) maxArchArea = arch;
    }

    const targetItem = mainItem || fallbackItem;
    const result: BuildingInfo = { '상태': '성공' };
    const children = targetItem.children;
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const tagName = child.tagName;
      const textContent = child.textContent?.trim() || '';
      const koreanName = BUILDING_FIELD_MAPPING[tagName] || tagName;
      result[koreanName] = textContent;
    }

    // 사용자 요청 규칙에 따른 최종 합계 적용
    result['연면적'] = sumMainTotArea.toString();
    result['부속건축물면적'] = sumAnnexTotArea.toString();
    result['총연면적'] = (sumMainTotArea + sumAnnexTotArea).toString();
    result['대지면적'] = maxPlatArea.toString();
    result['건축면적'] = maxArchArea.toString();
    
    if (items.length > 1) {
      const mainCount = rawItems.filter(item => 
        item.mainAtchGbCdNm === '주건축물' || 
        item.mainAtchBldSeCdNm === '주건축물' ||
        item.mainAtchBldSeCd === '0'
      ).length;
      result['_info'] = `주건축물 ${mainCount}개동 합산 (총 ${items.length}개동)`;
    }
    
    return { processed: result, raw: rawItems };
  } catch (error) {
    return { processed: { '상태': `API 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }, raw: [] };
  }
}
