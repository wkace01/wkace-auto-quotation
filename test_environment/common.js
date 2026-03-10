// ============================================================================
// [공통 모듈] common.js
// 우경정보통신 각 사업부에서 공통으로 사용하는 유틸리티 스크립트
// - 카카오 우편번호 API 연동 (UI 제어 포함)
// - 공공데이터포털 건축물대장 API 호출 (주소 기반 표제부 조회)
// ============================================================================

const JUSO_API_KEY = "U01TX0FVVEgyMDI1MTAxMDExNDkyNjExNjMxMTY=";
const BUILDING_API_KEY = "a80d7fbe3842d32f845889a352543d38fde0cf1625508e615c3fbf5705d36578";

/**
 * 1. 건물의 도로명/지번 주소 텍스트로 행정표준코드(법정동코드/시군구코드 등) 변환
 */
async function getAddressInfo(keyword) {
    const url = `https://www.juso.go.kr/addrlink/addrLinkApi.do?confmKey=${JUSO_API_KEY}&currentPage=1&countPerPage=5&keyword=${encodeURIComponent(keyword)}&resultType=json`;
    const res = await fetch(url);
    const data = await res.json();
    const common = data.results?.common;
    if (common?.errorCode !== '0') throw new Error(common?.errorMessage || '주소 API 오류');
    const juso = data.results?.juso?.[0];
    if (!juso) throw new Error('검색된 주소가 없습니다.');
    const admCd = juso.admCd || '';
    return {
        sigunguCd: admCd.substring(0, 5),
        bjdongCd: admCd.substring(5),
        bun: juso.lnbrMnnm || '',
        ji: juso.lnbrSlno || '0',
        roadAddr: juso.roadAddr,
        jibunAddr: juso.jibunAddr
    };
}

/**
 * 2. 건축물대장 표제부 API를 호출하여 건물 면적 및 상세 스펙 파악
 */
async function fetchBuildingRegister(info) {
    const { sigunguCd, bjdongCd, bun, ji } = info;
    const paddedBun = bun.padStart(4, '0');
    const paddedJi = ji.padStart(4, '0');
    // HTTPS 호환 및 XML 응답을 반환하는 안전한 Hub EndPoint 사용
    const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?serviceKey=${BUILDING_API_KEY}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${paddedBun}&ji=${paddedJi}&numOfRows=100&pageNo=1`;

    const res = await fetch(url);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const totalCount = parseInt(xmlDoc.getElementsByTagName('totalCount')[0]?.textContent || '0');
    if (totalCount === 0) throw new Error('해당 지번에 건축물대장 정보가 없습니다.');

    const items = xmlDoc.getElementsByTagName('item');
    const arr = Array.from(items);

    // 주건축물(mainAtchGbCd === '0') 찾기
    let target = arr.find(item => {
        const gbCd = item.getElementsByTagName('mainAtchGbCd')[0]?.textContent;
        return gbCd === '0';
    });
    if (!target) target = items[0];

    const getVal = (tag) => target.getElementsByTagName(tag)[0]?.textContent?.trim() || '';

    // 기존 app.js에서 사용하던 공용 스키마(Object) 형태로 반환
    return {
        totArea: getVal('totArea'),
        mainPurpsCdNm: getVal('mainPurpsCdNm'),
        platArea: getVal('platArea'),
        archArea: getVal('archArea'),
        useAprDay: getVal('useAprDay'),
        bldNm: getVal('bldNm'),
        mainAtchGbCdNm: getVal('mainAtchGbCdNm')
    };
}

/**
 * 3. 카카오 우편번호 서비스 임베딩 및 이벤트 핸들링 초기화 (index.html 연동)
 */
function initKakaoPostcode(embedContainerId, onCompleteCallback) {
    const el = document.getElementById(embedContainerId);
    if (!el) {
        console.warn(`[Kakao] 임베딩 컨테이너(#${embedContainerId})를 찾을 수 없습니다.`);
        return;
    }

    if (!window.daum || !window.daum.Postcode) {
        console.warn("[Kakao] Postcode SDK 미로드 상태");
        return;
    }

    new daum.Postcode({
        oncomplete: function (data) {
            let addr = data.roadAddress || data.jibunAddress;
            let extraAddr = '';

            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) extraAddr += data.bname;
            if (data.buildingName !== '' && data.apartment === 'Y') {
                extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            if (extraAddr !== '') addr += ` (${extraAddr})`;

            // 콜백 호출
            if (typeof onCompleteCallback === 'function') {
                onCompleteCallback(addr, data.buildingName);
            }
        },
        width: '100%',
        height: '100%'
    }).embed(el);
}

// Global Export
window.wkCommon = {
    getAddressInfo,
    fetchBuildingRegister,
    initKakaoPostcode
};
