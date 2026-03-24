# PDF 생성 & DB 저장 흐름

> "PDF 생성" 버튼 한 번을 누르면 뒤에서 무슨 일이 일어나는가

```mermaid
sequenceDiagram
    actor 담당자 as 👤 담당자
    participant 서버 as ⚙️ 서버
    participant PDF처리 as 📄 Excel→PDF 변환
    participant Airtable as 🗄️ Airtable DB

    담당자->>서버: PDF 생성 버튼 클릭

    Note over 담당자: ① 입력값 수집<br/>② 7개 시트 셀 매핑 생성

    서버->>PDF처리: Excel 템플릿에 데이터 주입

    Note over PDF처리: ③ 셀별 데이터 기입<br/>④ LibreOffice로 PDF 변환<br/>   (7페이지 통합 PDF)

    PDF처리-->>서버: PDF 완성

    서버-->>담당자: 📥 PDF 자동 다운로드

    Note over 서버,Airtable: ⑤ 백그라운드 처리<br/>(담당자는 이미 PDF 수령)

    서버->>Airtable: 고객 정보 저장/업데이트
    서버->>Airtable: 견적 기록 + PDF 첨부 업로드
    Airtable-->>서버: 저장 완료
```

---

## 핵심 포인트

| 항목 | 설명 |
|------|------|
| **버튼 클릭 후 체감 시간** | 약 5~10초 (LibreOffice 변환 시간) |
| **생성되는 PDF 페이지** | 7페이지 (표지 + 견적서 + 성능/유지/선임 산출내역 + 수량내역) |
| **Airtable 저장 방식** | PDF 다운로드 완료 후 백그라운드에서 자동 처리 (담당자 대기 불필요) |
| **중복 고객 처리** | 동일 건물명+주소가 이미 DB에 있으면 정보를 업데이트 (중복 생성 안 함) |

---

## DB 저장 버튼만 눌렀을 때

```mermaid
flowchart TD
    BTN["💾 DB 저장 버튼"]
    SEARCH["기존 고객 검색<br/>도로명 + 건물명 기준"]
    EXIST{{"이미 있는 고객?"}}
    UPDATE["고객 정보 업데이트"]
    CREATE["신규 고객 생성"]
    QUOTE["견적 기록 생성<br/>서비스 항목 · 금액 · 담당자"]
    DONE["✅ 저장 완료"]

    BTN --> SEARCH --> EXIST
    EXIST -->|"YES"| UPDATE --> QUOTE
    EXIST -->|"NO"| CREATE --> QUOTE
    QUOTE --> DONE
```
