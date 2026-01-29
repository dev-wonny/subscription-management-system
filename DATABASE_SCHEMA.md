# Database Schema

## ERD 개요
```
Plan (1) ─────< (N) Subscription (N) >───── (1) Customer
                         │
                         │
                         v
                    Invoice (N)
```

## 테이블 상세 명세

### 1. Plan 테이블 (플랜/요금제)
**목적**: 구독 상품의 요금제 정보를 관리

| 필드명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| plan_id | BIGSERIAL | 플랜 고유 ID | PK / Auto Increment |
| plan_name | VARCHAR(100) | 플랜 이름 (예: Basic, Pro, Enterprise) | UNIQUE / NOT NULL |
| monthly_price | DECIMAL(10, 2) | 월 정기 금액 | NOT NULL |
| billing_cycle | VARCHAR(10) | 정기 주기 (MONTHLY, ANNUAL) | NOT NULL |
| is_active | BOOLEAN | 플랜 활성화 여부 | DEFAULT TRUE |
| created_at | TIMESTAMP | 생성 시점 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 수정 시점 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**:
- `idx_plan_name` ON plan_name
- `idx_is_active` ON is_active

**샘플 데이터**:
```sql
INSERT INTO Plan (plan_name, monthly_price, billing_cycle, is_active) VALUES
('Basic', 9900.00, 'MONTHLY', TRUE),
('Pro', 19900.00, 'MONTHLY', TRUE),
('Enterprise', 49900.00, 'MONTHLY', TRUE);
```

---

### 2. Customer 테이블 (고객)
**목적**: 구독 서비스를 이용하는 고객 정보 관리

| 필드명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| customer_id | BIGSERIAL | 고객 고유 ID | PK / Auto Increment |
| name | VARCHAR(100) | 고객 이름 | NOT NULL |
| email | VARCHAR(255) | 고객 이메일 | UNIQUE / NOT NULL |
| phone | VARCHAR(20) | 전화번호 | - |
| status | VARCHAR(20) | 고객 상태 (ACTIVE, INACTIVE, SUSPENDED) | NOT NULL / DEFAULT 'ACTIVE' |
| created_at | TIMESTAMP | 레코드 생성 시점 | NOT NULL / DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 레코드 수정 시점 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**:
- `idx_customer_email` ON email
- `idx_customer_status` ON status

**샘플 데이터**:
```sql
INSERT INTO Customer (name, email, phone, status) VALUES
('김철수', 'kim@example.com', '010-1234-5678', 'ACTIVE'),
('이영희', 'lee@example.com', '010-2345-6789', 'ACTIVE'),
('박민수', 'park@example.com', '010-3456-7890', 'ACTIVE');
```

---

### 3. Subscription 테이블 (구독)
**목적**: 고객의 플랜 구독 정보 및 상태 관리

| 필드명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| subscription_id | BIGSERIAL | 구독 고유 ID | PK / Auto Increment |
| customer_id | BIGINT | 고객 ID | FK to Customer.customer_id / NOT NULL |
| plan_id | BIGINT | 플랜 ID | FK to Plan.plan_id / NOT NULL |
| start_date | DATE | 구독 시작일 | NOT NULL |
| end_date | DATE | 구독 종료일 (해지 시) | NULL 가능 |
| next_billing_date | DATE | 다음 정기 결제 예정일 | NOT NULL |
| status | VARCHAR(20) | 구독 상태 (ACTIVE, CANCELED, TRIAL, PAUSED) | NOT NULL / DEFAULT 'ACTIVE' |
| payment_method_token | VARCHAR(255) | 결제 수단 토큰 (PG사 연동) | NULL 가능 |
| created_at | TIMESTAMP | 생성 시점 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 수정 시점 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**:
- `idx_subscription_customer` ON customer_id
- `idx_subscription_plan` ON plan_id
- `idx_subscription_status` ON status
- `idx_next_billing_date` ON next_billing_date (스케줄러용)

**Foreign Keys**:
```sql
FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE
FOREIGN KEY (plan_id) REFERENCES Plan(plan_id) ON DELETE RESTRICT
```

**샘플 데이터**:
```sql
INSERT INTO Subscription (customer_id, plan_id, start_date, next_billing_date, status) VALUES
(1, 1, '2024-01-01', '2024-02-01', 'ACTIVE'),
(2, 2, '2024-01-15', '2024-02-15', 'ACTIVE'),
(3, 3, '2024-01-20', '2024-02-20', 'TRIAL');
```

---

### 4. Invoice 테이블 (청구 내역)
**목적**: 구독에 대한 청구 및 결제 내역 관리

| 필드명 | 데이터 타입 | 설명 | 제약 조건 |
|--------|------------|------|-----------|
| invoice_id | BIGSERIAL | 청구 내역 고유 ID | PK / Auto Increment |
| subscription_id | BIGINT | 구독 ID | FK to Subscription.subscription_id / NOT NULL |
| customer_id | BIGINT | 고객 ID (denormalized) | FK to Customer.customer_id / NOT NULL |
| billing_month | VARCHAR(7) | 청구 월 (YYYY-MM 형식) | NOT NULL |
| amount | DECIMAL(10, 2) | 청구 금액 | NOT NULL |
| payment_status | VARCHAR(20) | 결제 상태 (PENDING, PAID, FAILED, REFUNDED) | NOT NULL / DEFAULT 'PENDING' |
| payment_date | TIMESTAMP | 결제 완료 시점 | NULL 가능 |
| issued_at | TIMESTAMP | 청구서 발행 시점 | DEFAULT CURRENT_TIMESTAMP |
| due_date | DATE | 납부 기한 | NOT NULL |
| created_at | TIMESTAMP | 생성 시점 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 수정 시점 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**:
- `idx_invoice_subscription` ON subscription_id
- `idx_invoice_customer` ON customer_id
- `idx_invoice_billing_month` ON billing_month
- `idx_invoice_payment_status` ON payment_status
- `idx_invoice_due_date` ON due_date

**Foreign Keys**:
```sql
FOREIGN KEY (subscription_id) REFERENCES Subscription(subscription_id) ON DELETE CASCADE
FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE
```

**샘플 데이터**:
```sql
INSERT INTO Invoice (subscription_id, customer_id, billing_month, amount, payment_status, due_date) VALUES
(1, 1, '2024-01', 9900.00, 'PAID', '2024-01-31'),
(1, 1, '2024-02', 9900.00, 'PENDING', '2024-02-29'),
(2, 2, '2024-01', 19900.00, 'PAID', '2024-01-31'),
(3, 3, '2024-01', 0.00, 'PAID', '2024-01-31'); -- TRIAL은 무료
```

---

## 데이터베이스 마이그레이션 스크립트

### 생성 순서
1. Plan 테이블
2. Customer 테이블
3. Subscription 테이블
4. Invoice 테이블

### DDL 스크립트 위치
- `/backend/migrations/001_create_tables.sql`

---

## 비즈니스 규칙

### 구독 상태 전이
```
TRIAL → ACTIVE → CANCELED
  ↓       ↓
ACTIVE  PAUSED → ACTIVE
```

### 청구 로직
1. `next_billing_date`가 도래하면 자동으로 Invoice 생성
2. Invoice 생성 시 `payment_status`는 PENDING
3. 결제 성공 시 PAID로 변경, `payment_date` 기록
4. 결제 실패 시 FAILED로 변경, 재시도 로직 필요
5. 다음 `next_billing_date`를 플랜의 `billing_cycle`에 따라 계산

### 제약사항
- 한 고객은 동일 플랜에 대해 여러 구독을 가질 수 있음 (예: 추가 라이선스)
- Plan 삭제 시 Subscription은 유지되어야 함 (ON DELETE RESTRICT)
- Customer 삭제 시 관련 Subscription, Invoice도 삭제 (ON DELETE CASCADE)