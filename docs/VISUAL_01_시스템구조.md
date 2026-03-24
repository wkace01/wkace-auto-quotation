# 전체 시스템 구조도
> 이 시스템이 어떤 부품들로 이루어져 있는가

```mermaid
graph TB
    USER["🖥️ 사용자 브라우저"]

    subgraph FE["📄 프론트엔드"]
        FE1["index.html · app_step.js · constants.js · CSS"]
    end

    subgraph BE["⚙️ 백엔드 서버"]
        BE1["server.js"]
        BE2["Excel 템플릿"]
        BE3["LibreOffice"]
        BE1 --> BE2 --> BE3
    end

    subgraph EXT["🌐 외부 서비스"]
        EXT1["카카오 주소 API"]
        EXT2["건축물대장 API"]
        EXT3["Airtable DB"]
    end

    USER --> FE
    FE -->|"PDF 생성 요청"| BE1
    BE3 -->|"PDF 다운로드"| USER
    BE1 --> EXT3
    FE --> EXT1
    FE --> EXT2

    style FE fill:#dcfce7,stroke:#22c55e
    style BE fill:#fef9c3,stroke:#eab308
    style EXT fill:#fce7f3,stroke:#ec4899
```

---

| 구성 요소 | 역할 |
|----------|------|
| 프론트엔드 | 화면 구성 + 계산 로직 |
| 백엔드 서버 | PDF 생성 + DB 저장 중개 |
| 카카오 API | 주소 검색 |
| 건축물대장 API | 연면적·용도 자동 조회 |
| Airtable | 고객·견적 데이터 저장 |
