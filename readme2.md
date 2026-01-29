# 구독 관리 시스템 (Subscription Management System)

본 프로젝트는 고객의 구독(Subscription) 주기와 그에 따른 청구(Invoice) 내역을 관리하는 풀스택 애플리케이션 과제 제출물입니다.

## 1. 프로젝트 개요
구독 서비스의 핵심 비즈니스 로직(구독 추가, 플랜 변경, 차액 계산, 청구 자동 생성)을 구현하고, 이를 관리자가 한눈에 파악할 수 있는 대시보드와 API 명세서를 제공합니다.

### 핵심 기능
- **인보이스 대시보드**: 월별/상태별/고객별 필터링 및 전 컬럼 정렬(Sorting) 지원.
- **비즈니스 로직**: 
    - 구독 추가 시 첫 달 인보이스 즉시 생성 (스냅샷 결제 토큰 포함).
    - 플랜 변경 시 차액 계산 및 프로레이티드(Pro-rated) 인보이스 자동 생성.
- **개발 환경 최적화**: Docker 기반 DB 구축, Web DB GUI(Adminer), Swagger API 명세서 통합.

---

## 2. 기술 스택
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Dockerized)
- **Frontend**: React (Vite), Axios, Lucide React (Icons)
- **API Spec**: Swagger (OpenAPI 3.0)
- **Testing**: Jest, Supertest (TDD 적용)

---

## 3. 실행 방법 (Local)

프로젝트 루트 디렉토리에서 아래 순서대로 실행해 주세요.

### Step 1: 인프라 실행 (Docker)
DB와 관리 도구를 실행합니다.
```bash
docker-compose up -d
```

### Step 2: 백엔드 초기화 및 실행
```bash
cd backend
npm install
npm run migrate  # 테이블 생성 및 풍부한 샘플 데이터(7개/테이블) 로드
npm run dev      # 3000 포트 실행
```

### Step 3: 프론트엔드 실행
```bash
cd ../frontend
npm install
npm run dev      # 5173 포트 실행
```

---

## 4. 테스트 및 확인 URL (Local 기반)

실행 후 브라우저에서 아래 주소들을 통해 기능을 확인하실 수 있습니다.

- **📜 API 명세서 (Swagger)**: [http://localhost:3000/api/v1/docs/](http://localhost:3000/api/v1/docs/)
    - 모든 API를 브라우저에서 직접 테스트해 볼 수 있습니다.
- **🖥️ 관리자 대시보드 (React)**: [http://localhost:5173/](http://localhost:5173/)
    - 정렬, 검색, 초기화 버튼 기능을 확인할 수 있습니다.
- **🗃️ DB 관리 도구 (Adminer)**: [http://localhost:8080/](http://localhost:8080/)
    - **Host**: `db`, **User/PW/DB**: `postgres` / `postgres` / `homework`
    - 실제 SQL 데이터를 직접 조회하고 편집할 수 있습니다.

---

## 5. 품질 검증 (TDD)
백엔드의 주요 API 안정성을 검증하기 위해 테스트 코드가 작성되어 있습니다.
```bash
cd backend
npm test
```
- 모든 요청에 대한 200 OK 응답 및 데이터 정합성 검증 완료.

---

## 6. 비즈니스 로직 주요 설계
- **결제 토큰 스냅샷**: 결제 수단이 구독 기간 중 변경될 수 있음을 고려하여, 인보이스 생성 시점의 토큰을 `Invoice` 테이블에 별도로 기록합니다 (사용자 요청 반영).
- **트랜잭션 처리**: 구독 수정 및 추가 시 DB 트랜잭션(`BEGIN/COMMIT`)을 적용하여 데이터 무결성을 보장합니다.
- **검색 편의성**: Billing Month 입력 필드에 'Type Switching' 기법을 적용하여 Placeholder와 DatePicker의 사용성을 동시에 확보했습니다.
