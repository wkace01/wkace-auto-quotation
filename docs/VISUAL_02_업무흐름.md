# 사용자 업무 흐름도

> 담당자가 실제로 이 시스템을 어떻게 사용하는가

```mermaid
flowchart TD
    START(["🚀 시작<br/>시스템 접속"])

    subgraph STEP1["📍 Step 1 — 주소 검색"]
        S1A["건물명 또는 도로명 입력"]
        S1B["카카오 주소 목록에서 선택"]
        S1C["✅ 주소 확정<br/>→ Step 2 자동 이동"]
    end

    subgraph STEP2["🏢 Step 2 — 건물 정보 + 견적 설정"]
        S2A["건축물대장 자동 조회<br/>연면적 · 용도 · 사용승인일 자동 입력"]
        S2B["거래처 담당자 정보 입력<br/>이름 · 직함 · 연락처"]
        S2C["영업담당자 선택<br/>+ 견적일 확인"]
        S2D{{"견적 조건 확인<br/>(자동 계산된 금액)"}}
        S2E["금액 수동 조정 필요?"]
        S2F["± 버튼 또는 직접 입력으로 조정<br/>배수 · 할인율 · 항목 ON/OFF"]
        S2G["✅ 견적 완성"]
    end

    subgraph ACTION["⚡ 액션 선택"]
        A1["📄 PDF 생성 버튼"]
        A2["💾 DB 저장 버튼"]
    end

    subgraph RESULT["🎯 결과"]
        R1["PDF 파일 자동 다운로드<br/>파일명: 견적고유ID_견적서_고객명_담당자님.pdf"]
        R2["Airtable에 자동 저장<br/>고객정보 + 견적기록 + PDF 첨부"]
    end

    STEP3(["📊 Step 3<br/>상세 산출 내역 확인<br/>(성능/유지/선임 각 탭)"])

    START --> S1A
    S1A --> S1B --> S1C
    S1C --> S2A
    S2A --> S2B --> S2C --> S2D
    S2D --> S2E
    S2E -->|"YES"| S2F --> S2G
    S2E -->|"NO (그대로 사용)"| S2G
    S2G --> A1
    S2G --> A2
    A1 --> R1
    A2 --> R2
    R1 -.->|"상세 확인 원할 시"| STEP3
    R2 -.->|"상세 확인 원할 시"| STEP3

    style STEP1 fill:#dbeafe,stroke:#3b82f6
    style STEP2 fill:#dcfce7,stroke:#22c55e
    style ACTION fill:#fef9c3,stroke:#eab308
    style RESULT fill:#fce7f3,stroke:#ec4899
```

---

## 소요 시간 비교

| 단계 | 자동화 전 | 자동화 후 |
|------|----------|----------|
| 건물 정보 입력 | 인터넷 검색 후 수기 입력 (5~10분) | 주소 선택 → 자동 입력 (30초) |
| 금액 계산 | 엑셀 수식 직접 작성 (10~20분) | 연면적 입력 → 자동 계산 (즉시) |
| PDF 저장 | 엑셀 → PDF 변환 → 파일명 정리 (5분) | 버튼 1번 (10초) |
| DB 저장 | 별도 시트에 수기 입력 (5분) | 버튼 1번 (자동) |
| **총 소요시간** | **약 30~40분** | **약 2~3분** |
