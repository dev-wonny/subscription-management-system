# 구독 관리 시스템 (Subscription Management System)

## 프로젝트 개요
구독 기반 비즈니스 모델을 지원하는 풀스택 웹 애플리케이션입니다. 고객의 구독 생애주기 관리(가입-유지-해지), 플랜 관리, 청구/결제 내역 추적 기능을 제공합니다.

## 시현 영상
- 도커로 서비스 4개 띄움
- https://www.youtube.com/watch?v=vhpvOZJUdOA
- 도커로 띄운 이유는 aws ecs에 배포하기 위함

## Docker 실행
```text
  ┌───────────────────────┬─────────┬───────────────────────┐                                                                           
  │       컨테이너        │  상태   │       접속 주소       │                                                                           
  ├───────────────────────┼─────────┼───────────────────────┤                                                                           
  │ subscription_frontend │ Running │ http://localhost:5173 │                                                                           
  ├───────────────────────┼─────────┼───────────────────────┤                                                                           
  │ subscription_backend  │ Running │ http://localhost:3000 │                                                                           
  ├───────────────────────┼─────────┼───────────────────────┤                                                                           
  │ subscription_db       │ Running │ localhost:5432        │                                                                           
  ├───────────────────────┼─────────┼───────────────────────┤                                                                           
  │ subscription_adminer  │ Running │ http://localhost:8080 │                                                                           
  └───────────────────────┴─────────┴───────────────────────┘   
```

## 기술 스택

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL 15 (Docker)
- **ORM/Query**: pg (node-postgres)
- **API Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Testing**: Jest 30.2.0, Supertest 7.2.2
- **기타**:
  - morgan (HTTP 로깅)
  - dotenv (환경변수 관리)
  - cors (CORS 설정)

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.1.4
- **HTTP Client**: Axios 1.13.4
- **UI Components**:
  - lucide-react (아이콘)
  - react-datepicker (날짜 선택)
  - date-fns (날짜 포맷팅)

### Infrastructure
- **컨테이너**: Docker Compose
- **DB 관리**: Adminer (웹 기반 DB 클라이언트)

## 프로젝트 구조

```
homework/
├── backend/
│   ├── index.js              # Express 서버 및 API 라우트
│   ├── db.js                 # PostgreSQL 연결 설정
│   ├── migrate.js            # 테이블 생성 및 샘플 데이터 로드
│   ├── package.json          # Backend 의존성
│   └── tests/
│       └── api.test.js       # API 테스트
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # 메인 React 컴포넌트
│   │   └── main.jsx          # React 앱 진입점
│   ├── package.json          # Frontend 의존성
│   └── vite.config.js        # Vite 설정
├── docker-compose.yml        # PostgreSQL & Adminer 컨테이너
├── DATABASE_SCHEMA.md        # DB 스키마 명세
├── API_SPEC.md               # API 명세서
├── REQUIREMENTS.md           # 요구사항 명세
├── DEPLOYMENT.md             # 배포 가이드
└── README.md                 # 프로젝트 설명

```

## 데이터베이스 스키마

### ERD (Entity Relationship Diagram)
```
Plan (1) ─────< (N) Subscription (N) >───── (1) Customer
                         │
                         │
                         v
                    Invoice (N)
```

### 주요 테이블

#### 1. Plan (플랜/요금제)
- 구독 상품의 요금제 정보 관리
- 주요 필드: `plan_id`, `plan_name`, `monthly_price`, `billing_cycle`, `is_active`

#### 2. Customer (고객)
- 서비스 구독 고객 정보
- 주요 필드: `customer_id`, `name`, `email`, `phone`, `status`

#### 3. Subscription (구독)
- 고객과 플랜을 연결하는 구독 계약
- 주요 필드: `subscription_id`, `customer_id`, `plan_id`, `start_date`, `next_billing_date`, `status`, `payment_method_token`
- 상태: ACTIVE, CANCELED, TRIAL, PAUSED

#### 4. Invoice (청구 내역)
- 구독에 대한 청구 및 결제 내역
- 주요 필드: `invoice_id`, `subscription_id`, `customer_id`, `billing_month`, `amount`, `payment_status`, `due_date`
- 결제 상태: PENDING, PAID, FAILED, REFUNDED

## 핵심 기능

### 1. 청구 내역 조회 (Invoice Dashboard)
- **API**: `GET /api/v1/invoices`
- **기능**:
  - 전체 청구 내역 목록 조회
  - 다중 필터링: 청구월, 결제 상태, 고객별
  - 전 컬럼 정렬 (Sorting): 고객명, 플랜명, 청구월, 금액, 결제 상태, 납부기한 등
  - 페이지네이션 (기본 20개/페이지)
- **화면 요소**:
  - 고객 정보 (이름, 이메일)
  - 플랜 정보
  - 청구월 및 금액
  - 결제 상태 뱃지
  - 구독 상태 표시
  - 빠른 액션 버튼 (구독 설정, 결제 상태 변경)

### 2. 구독 추가 (Add Subscription)
- **API**: `POST /api/v1/subscriptions/add`
- **기능**:
  - 새로운 구독 생성
  - 고객 및 플랜 선택 (드롭다운)
  - 시작일 지정 (DatePicker)
  - 결제 수단 토큰 입력
  - 초기 상태 선택 (ACTIVE/TRIAL)
- **비즈니스 로직**:
  - `next_billing_date` 자동 계산 (플랜의 billing_cycle 기반)
  - 첫 달 Invoice 자동 생성 (TRIAL 제외)
  - 트랜잭션 처리 (Subscription + Invoice 동시 생성)

### 3. 구독 수정 (Modify Subscription)
- **API**: `POST /api/v1/subscriptions/modify`
- **기능**:
  - 플랜 변경 (업그레이드/다운그레이드)
  - 결제 수단 변경
  - 상태 변경 (ACTIVE, PAUSED, CANCELED)
  - 해지일 설정 (CANCELED 시)
- **비즈니스 로직**:
  - 플랜 변경 시 차액 계산 및 프로레이티드 Invoice 생성
  - 업그레이드 시 추가 청구 금액 안내
  - 해지 시 `next_billing_date` null 처리

### 4. 플랜 관리 (Plan Management)
- **API**: `POST /api/v1/plans`, `PUT /api/v1/plans/:id`
- **기능**:
  - 플랜 생성 및 수정
  - 플랜명, 가격, 청구 주기(월간/연간) 설정
  - 활성화/비활성화 상태 관리

### 5. 결제 상태 관리 (Payment Status Update)
- **API**: `POST /api/v1/invoices/update-status`
- **기능**:
  - 개별 청구 내역의 결제 상태 빠른 변경
  - PENDING → PAID/FAILED 전환
  - 결제 완료 시 `payment_date` 자동 기록

## 실행 방법

### 사전 요구사항
- Node.js 18 이상
- Docker 및 Docker Compose
- npm 또는 yarn

### 1. 데이터베이스 실행 (Docker)
```bash
docker-compose up -d
```
- PostgreSQL: `localhost:5432`
- Adminer (DB 관리 도구): `http://localhost:8080`
  - Host: `db`
  - User: `postgres`
  - Password: `postgres`
  - Database: `homework`

### 2. Backend 실행
```bash
cd backend
npm install
npm run migrate      # 테이블 생성 및 샘플 데이터 로드 (각 테이블당 7개)
npm run dev          # 개발 서버 실행 (http://localhost:3000)
```

### 3. Frontend 실행
```bash
cd frontend
npm install
npm run dev          # 개발 서버 실행 (http://localhost:5173)
```

### 4. 테스트 실행
```bash
cd backend
npm test             # Jest 테스트 실행
```

## 주요 엔드포인트

### API 문서
- **Swagger UI**: `http://localhost:3000/api/v1/docs`
- 모든 API를 브라우저에서 직접 테스트 가능

### 핵심 API
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/invoices` | 청구 내역 조회 (필터링, 정렬, 페이지네이션) |
| POST | `/api/v1/subscriptions/add` | 구독 추가 |
| POST | `/api/v1/subscriptions/modify` | 구독 수정 |
| POST | `/api/v1/invoices/update-status` | 결제 상태 변경 |
| GET | `/api/v1/customers` | 고객 목록 조회 |
| GET | `/api/v1/plans` | 플랜 목록 조회 |
| POST | `/api/v1/plans` | 플랜 생성 |
| PUT | `/api/v1/plans/:id` | 플랜 수정 |
| GET | `/api/v1/subscriptions` | 구독 목록 조회 |

## 비즈니스 로직 설계

### 1. 구독 생성 플로우
```
1. 고객 및 플랜 선택
2. 시작일 입력
3. next_billing_date 자동 계산
   - MONTHLY: start_date + 1개월
   - ANNUAL: start_date + 1년
4. Subscription 레코드 생성 (트랜잭션 시작)
5. 첫 달 Invoice 생성 (status=TRIAL 제외)
   - billing_month: start_date의 YYYY-MM
   - amount: 플랜의 monthly_price
   - payment_status: PENDING
   - due_date: start_date + 30일
6. 트랜잭션 커밋
```

### 2. 플랜 변경 플로우
```
1. 기존 구독 조회
2. 새 플랜과 기존 플랜 비교
3. 가격 차액 계산
   - price_diff = new_plan.monthly_price - old_plan.monthly_price
4. price_diff > 0인 경우 (업그레이드)
   - 차액만큼의 프로레이티드 Invoice 생성
   - payment_status: PENDING
   - due_date: 현재일 + 7일
5. Subscription의 plan_id 업데이트
6. 트랜잭션 커밋
```

### 3. 결제 토큰 스냅샷
- 구독 기간 중 결제 수단이 변경될 수 있음을 고려
- Invoice 생성 시점의 `payment_method_token`을 Invoice 테이블에 별도 저장
- 과거 결제 내역의 무결성 유지

### 4. 상태 전이
```
구독 상태:
TRIAL → ACTIVE → PAUSED → ACTIVE
         ↓
      CANCELED (최종 상태)

결제 상태:
PENDING → PAID (성공)
   ↓
FAILED → PENDING (재시도)
   ↓
REFUNDED (환불)
```

## 데이터 유효성 검증

### Backend (API 레벨)
- 필수 필드 검증
- 플랜 활성화 상태 확인
- 해지 시 `end_date` 필수 검증
- 이미 해지된 구독 수정 방지
- SQL Injection 방어 (Parameterized Query)

### Frontend (UI 레벨)
- 필수 입력 필드 체크
- 날짜 형식 검증
- 실시간 차액 계산 및 안내 메시지
- 해지 확인 다이얼로그

## 성능 최적화

### 데이터베이스 인덱스
```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_invoice_billing_month ON Invoice(billing_month);
CREATE INDEX idx_invoice_payment_status ON Invoice(payment_status);
CREATE INDEX idx_invoice_customer ON Invoice(customer_id);
CREATE INDEX idx_subscription_status ON Subscription(status);
CREATE INDEX idx_next_billing_date ON Subscription(next_billing_date);
```

### 쿼리 최적화
- JOIN을 활용한 데이터 조회 (N+1 문제 방지)
- 페이지네이션 적용 (LIMIT/OFFSET)
- 필터링 조건을 WHERE 절에 적용

## 테스트 전략

### Backend 테스트 (Jest + Supertest)
- API 응답 상태 코드 검증
- 데이터 정합성 확인
- 에러 핸들링 테스트
- 테스트 실행: `npm test`

### 테스트 커버리지
- GET /api/v1/invoices: 200 OK 응답 검증
- POST /api/v1/subscriptions/add: 구독 생성 및 Invoice 자동 생성 확인
- POST /api/v1/subscriptions/modify: 플랜 변경 및 차액 정산 확인

## 배포 가이드

자세한 배포 방법은 `DEPLOYMENT.md` 참조

### 추천 플랫폼
- **Frontend**: Vercel, Netlify
- **Backend**: Render, Railway, Fly.io
- **Database**: Render (PostgreSQL), Supabase

### 환경 변수 설정
Backend (`.env`):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=homework
PORT=3000
```

Frontend (`.env`):
```
VITE_API_BASE_URL=http://localhost:3000
```

## 주요 문서

- `REQUIREMENTS.md`: 요구사항 명세서
- `DATABASE_SCHEMA.md`: DB 스키마 상세 명세
- `API_SPEC.md`: REST API 명세서
- `DEPLOYMENT.md`: 배포 가이드

## 기술적 특징

### 1. 트랜잭션 처리
- 구독 생성/수정 시 BEGIN-COMMIT 트랜잭션 적용
- 데이터 무결성 보장
- 에러 발생 시 ROLLBACK

### 2. RESTful API 설계
- 명확한 리소스 기반 엔드포인트
- HTTP 메서드 활용 (GET, POST, PUT)
- 표준 HTTP 상태 코드 사용
- 일관된 JSON 응답 형식

### 3. 에러 핸들링
- 구조화된 에러 응답
- 에러 코드 및 메시지 제공
- 클라이언트 친화적 에러 메시지

### 4. API 문서화
- Swagger (OpenAPI 3.0) 자동 생성
- 인터랙티브 API 테스트 가능
- JSDoc 주석 기반 자동화

### 5. UI/UX 고려사항
- 반응형 디자인
- 로딩 인디케이터
- Toast 알림 (성공/실패)
- 직관적인 모달 인터페이스
- 실시간 차액 계산 안내

## 샘플 데이터

Migration 스크립트 실행 시 각 테이블에 7개 이상의 샘플 데이터 자동 로드:
- 7개 플랜 (다양한 가격대 및 청구 주기)
- 7개 고객 (다양한 상태)
- 7개 구독 (다양한 상태 및 플랜)
- 7개 청구 내역 (다양한 결제 상태)

## 확장 가능성

### 향후 추가 가능 기능
1. **배치 스케줄러**: `next_billing_date` 도래 시 자동 Invoice 생성
2. **PG사 연동**: 실제 결제 게이트웨이 통합
3. **Webhook 수신**: 결제 완료/실패 이벤트 처리
4. **할인/쿠폰 시스템**: Invoice에 할인 적용
5. **다중 결제 수단**: 고객당 복수의 결제 카드 관리
6. **이메일 알림**: 청구서 발행, 결제 완료 등 이메일 발송
7. **대시보드**: 매출 통계, 이탈률, MRR(월간 반복 매출) 시각화
8. **사용량 기반 과금**: 사용량에 따른 종량제 요금 계산

## 라이선스

이 프로젝트는 학습 및 과제 제출 목적으로 작성되었습니다.

## 개발자

DevWonny

## 버전 정보

- Version: 1.0.0
- Last Updated: 2026-01-29
