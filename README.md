# 🏢 정보통신 성능점검 및 유지관리 견적 자동화 시스템

정보통신사업부의 업무 효율성을 극대화하기 위해 개발된 **"원스톱 견적서 자동 생성 시스템"**입니다.
복잡한 연면적 계산 및 단가 산출을 자동화하고, 데이터를 최종 엑셀 템플릿에 주입하여 PDF로 즉시 변환 및 다운로드할 수 있는 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Key Features)

### 1. 대상처 자동 정보 조회 (API 연동)
- **카카오 우편번호 API:** 건물명 및 정확한 도로명/지번 주소 검색
- **공공데이터포털 건축물대장 API:** 해당 건물의 대지면적, 건축면적, 연면적(주건축물), 사용승인일, 주용도 자동 조회 및 입력

### 2. 조건별 스마트 견적 산출
- 건축물대장의 **연면적 데이터**를 활용해 **건물 등급(초급, 중급, 고급, 특급)** 및 **조정 계수** 자동 판별
- 관리 등급에 따른 성능점검, 유지관리, 선임위탁의 투입 인력(명) 도출
- 노임 단가 표를 바탕으로 제경비 (110%), 기술료 (20%) 등 복잡한 견적 산식 실시간 자동 도출
- 견적 항목의 추가/제외 토글, 금액 미세 조정 및 할인율 적용을 반영한 **실시간 월/연간 견적액 시뮬레이션 기능**

### 3. 고품질 PDF 리포트 무손실 생성
- 서버 측에 엑셀 원본 템플릿(`정보통신사업부 견적서 양식_ver1.xlsx`) 영구 보관 (보안 보호)
- **`xlsx-populate` 라이브러리:** 기존 `ExcelJS`에서 발생하던 LibreOffice 변환 시 인쇄 영역/페이지 레이아웃 파손 버그를 원천 차단하여, 디자인 로스 없는 원본 XML 데이터 구조 완벽 보존 쓰기 처리
- **`LibreOffice CLI`:** 엑셀 파일을 백그라운드 환경에서 즉각 고화질 PDF 브로셔(7페이지 통합)로 무손실 랜더링 후 다운로드 응답

### 4. 반응형 모바일 지원 및 모던 UI (Toss 스타일)
- **Toss 디자인 시스템 적용:** 깔끔하고 직관적인 UI/UX(여백, 폰트, 카드 레이아웃)를 통해 사용자 경험 극대화
- **단계별(Step-by-step) 마법사 폼:** 1단계(주소 검색) → 2단계(건물 검색 및 견적 조정) → 3단계(결과 확인)로 자연스럽게 이어지는 업무 흐름 제공
- Media Query(`@media (max-width: 768px)`)를 활용한 완벽한 모바일 뷰어 최적화
- 현장 미팅 시 스마트폰 등 소형 화면에서도 1열 그리드 및 자동 스크롤을 통해 편하게 검토하고 즉석 PDF 생성 가능

---

## 🛠 기술 스택 (Tech Stack)

### Frontend (User Interface)
- **HTML5 / CSS3 (Vanilla System):** 별도의 무거운 프레임워크 제약을 없애 체감 로딩 속도 최적화
- **JavaScript (ES6):** 클라이언트 측 상태(State) 관리, 알고리즘 연산 수행 후 결과 JSON 추출
- **FontAwesome:** 직관적인 웹 폰트 아이콘 활용

### Backend (API & File Server)
- **Node.js & Express:** 경량 웹 서버 구동 (정적 호스팅 및 API 요청 라우팅 통합 패키징)
- **xlsx-populate:** Excel의 복잡한 Data Structure 조작 시 포맷 깨짐 방지
- **LibreOffice:** Excel ➔ PDF 무손실 Engine Process Execute

---

## 📂 프로젝트 폴더 구조 (Folder Directory)

```text
정보통신사업부/
├── public/                     # [Frontend] 사용자가 접속 시 내려받는 화면 단 파일
│   ├── index.html              # 메인 구조 및 레이아웃 (새로운 Toss UI 마법사 적용본)
│   ├── app_step.js             # 단계별 뷰 조작 로직, 통신 로직, 계산 알고리즘
│   ├── common.js               # 카카오 주소 및 공공데이터포털 공통 API 모듈
│   ├── toss_step_style.css     # 데스크톱 및 모바일 반응형(Grid, Flex) Toss 스타일링
│   └── data.js                 # 엑셀 단가표, 조정계수, 등급별 기초 데이터 상수 모음
│
├── server.js                   # [Backend] Node.js 백엔드 서버 (프론트 서빙 기능 + POST PDF 변환)
├── package.json                # npm 패키지 버전 관리
└── 정보통신사업부 견적서 양식_ver1.xlsx # PDF 생성 모판용 마스터 원본 엑셀
```
> ※ `.gitignore` 에 등록된 캐시 및 임시 파일, `_archive/` 디렉토리 속 지난 테스트 파일은 저장소에 업로드되지 않습니다.

---

## 🚀 로컬 환경 구동 방법 (How to Run Locally)

1. **소스 코드 다운로드 및 의존성 패키지 셋업**
   ```bash
   npm install
   ```

2. **사전 준비 (필수)**
   - 윈도우 PC인 경우 [LibreOffice](https://www.libreoffice.org/download/download/)가 `C:\Program Files\LibreOffice\program\soffice.exe` 경로에 정상 설치되어 있어야 PDF 생성 API가 정상 작동합니다.

3. **통합 서버 실행**
   ```bash
   npm start
   ```
   > 작동 시 `http://localhost:3001` 로 접속하여 애플리케이션 웹 뷰와 API를 동시에 사용할 수 있습니다.

---

## 🌐 서버 배포 가이드 (Server Deployment Guide - for Railway)

이 애플리케이션은 **PDF 변환 처리를 위해 리눅스/컨테이너 환경(LibreOffice 바이너리 실행 가능 영역)** 을 반드시 요구합니다.  
(AWS Lambda 계열의 퓨어 Serverless 환경인 Vercel, Netlify의 Server Functions은 불가)

현재 프로젝트는 **Nixpacks**가 내장된 Docker Container 지향형 플랫폼인 **[Railway.app](https://railway.app/)** 또는 **[Render.com](https://render.com/)** 에 단일 레포지토리 배포가 가능하도록 코드가 분기된 상태입니다.

- `server.js` 라인 12: `NODE_ENV === 'production'` 일 시 운영체제 전역 `$ soffice` 가 바라보도록 되어 있어 OS 호환성이 맞춰져 있습니다.  
- GitHub을 통해 소스를 Push한 이후 배포 대시보드에서 패키지와 OS 의존성을 자동으로 해결하는 구조입니다.

---

**ⓒ 2026. 우경정보통신 (Wookyung Information & Communication) All rights reserved.**
