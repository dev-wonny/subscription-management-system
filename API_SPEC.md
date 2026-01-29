# API Specification

## Base URL
```
http://localhost:3000/api/v1
```

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "Success message"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## HTTP Status Codes
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `404 Not Found`: 리소스 없음
- `500 Internal Server Error`: 서버 오류

---

## 1. 청구 내역 조회 API

### GET /api/v1/invoices
**목적**: 모든 고객의 청구 내역(invoice) 조회

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| page | integer | X | 페이지 번호 (1부터 시작) | 1 |
| limit | integer | X | 페이지당 항목 수 | 20 |
| billing_month | string | X | 청구월 필터 (YYYY-MM) | 2024-01 |
| payment_status | string | X | 결제 상태 필터 | PAID, PENDING, FAILED |
| customer_id | integer | X | 특정 고객 필터 | 1 |
| sort_by | string | X | 정렬 기준 | issued_at, billing_month |
| sort_order | string | X | 정렬 순서 | asc, desc |

**Request Example**:
```http
GET /api/v1/invoices?page=1&limit=20&payment_status=PENDING&sort_by=due_date&sort_order=asc
```

**Response Example** (200 OK):
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoice_id": 123,
        "subscription_id": 45,
        "customer": {
          "customer_id": 1,
          "name": "김철수",
          "email": "kim@example.com"
        },
        "plan": {
          "plan_id": 2,
          "plan_name": "Pro"
        },
        "billing_month": "2024-02",
        "amount": 19900.00,
        "payment_status": "PENDING",
        "payment_date": null,
        "due_date": "2024-02-29",
        "issued_at": "2024-02-01T00:00:00Z",
        "created_at": "2024-02-01T00:00:00Z"
      },
      {
        "invoice_id": 124,
        "subscription_id": 46,
        "customer": {
          "customer_id": 2,
          "name": "이영희",
          "email": "lee@example.com"
        },
        "plan": {
          "plan_id": 1,
          "plan_name": "Basic"
        },
        "billing_month": "2024-02",
        "amount": 9900.00,
        "payment_status": "PAID",
        "payment_date": "2024-02-05T10:30:00Z",
        "due_date": "2024-02-29",
        "issued_at": "2024-02-01T00:00:00Z",
        "created_at": "2024-02-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 98,
      "items_per_page": 20
    }
  },
  "message": "청구 내역을 성공적으로 조회했습니다."
}
```

**Error Cases**:
- `400 Bad Request`: 잘못된 필터 파라미터
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "billing_month는 YYYY-MM 형식이어야 합니다."
  }
}
```

---

## 2. 구독 추가 API

### POST /api/v1/subscriptions/add
**목적**: 새로운 구독 정보 추가

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "customer_id": 1,
  "plan_id": 2,
  "start_date": "2024-02-01",
  "payment_method_token": "tok_visa_1234",
  "status": "ACTIVE"  // optional, default: ACTIVE
}
```

**Request Body Fields**:
| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|---------|
| customer_id | integer | O | 고객 ID | Customer 테이블에 존재해야 함 |
| plan_id | integer | O | 플랜 ID | Plan 테이블에 존재하고 is_active=true |
| start_date | string | O | 구독 시작일 (YYYY-MM-DD) | 과거 또는 현재 날짜 |
| payment_method_token | string | X | 결제 수단 토큰 | 최대 255자 |
| status | string | X | 초기 상태 | ACTIVE, TRIAL 중 선택 (기본: ACTIVE) |

**Response Example** (201 Created):
```json
{
  "success": true,
  "data": {
    "subscription": {
      "subscription_id": 100,
      "customer_id": 1,
      "plan_id": 2,
      "start_date": "2024-02-01",
      "end_date": null,
      "next_billing_date": "2024-03-01",
      "status": "ACTIVE",
      "payment_method_token": "tok_visa_1234",
      "created_at": "2024-02-01T10:30:00Z",
      "updated_at": "2024-02-01T10:30:00Z",
      "customer": {
        "customer_id": 1,
        "name": "김철수",
        "email": "kim@example.com"
      },
      "plan": {
        "plan_id": 2,
        "plan_name": "Pro",
        "monthly_price": 19900.00,
        "billing_cycle": "MONTHLY"
      }
    }
  },
  "message": "구독이 성공적으로 추가되었습니다."
}
```

**비즈니스 로직**:
1. `customer_id`와 `plan_id` 유효성 검증
2. `next_billing_date` 자동 계산: `start_date + billing_cycle`
   - MONTHLY: +1개월
   - ANNUAL: +1년
3. 첫 번째 Invoice 자동 생성 (status=TRIAL인 경우 제외)
4. Transaction으로 처리 (Subscription + Invoice)

**Error Cases**:

```json
// 400 Bad Request - 필수 필드 누락
{
  "success": false,
  "error": {
    "code": "MISSING_REQUIRED_FIELD",
    "message": "customer_id는 필수 항목입니다."
  }
}

// 404 Not Found - 고객 없음
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "해당 고객을 찾을 수 없습니다."
  }
}

// 400 Bad Request - 플랜 비활성화
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_ACTIVE",
    "message": "비활성화된 플랜입니다."
  }
}
```

---

## 3. 구독 수정 API

### POST /api/v1/subscriptions/modify
**목적**: 기존 구독 정보 수정

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "subscription_id": 100,
  "plan_id": 3,  // optional
  "status": "PAUSED",  // optional
  "payment_method_token": "tok_visa_5678",  // optional
  "end_date": "2024-12-31"  // optional (해지 시)
}
```

**Request Body Fields**:
| 필드 | 타입 | 필수 | 설명 | 제약사항 |
|------|------|------|------|---------|
| subscription_id | integer | O | 구독 ID | Subscription 테이블에 존재해야 함 |
| plan_id | integer | X | 변경할 플랜 ID | Plan 테이블에 존재하고 is_active=true |
| status | string | X | 변경할 상태 | ACTIVE, PAUSED, CANCELED 중 선택 |
| payment_method_token | string | X | 변경할 결제 수단 | 최대 255자 |
| end_date | string | X | 해지일 (YYYY-MM-DD) | status=CANCELED인 경우 필수 |

**Response Example** (200 OK):
```json
{
  "success": true,
  "data": {
    "subscription": {
      "subscription_id": 100,
      "customer_id": 1,
      "plan_id": 3,
      "start_date": "2024-02-01",
      "end_date": null,
      "next_billing_date": "2024-03-01",
      "status": "ACTIVE",
      "payment_method_token": "tok_visa_5678",
      "created_at": "2024-02-01T10:30:00Z",
      "updated_at": "2024-02-15T14:20:00Z",
      "customer": {
        "customer_id": 1,
        "name": "김철수",
        "email": "kim@example.com"
      },
      "plan": {
        "plan_id": 3,
        "plan_name": "Enterprise",
        "monthly_price": 49900.00,
        "billing_cycle": "MONTHLY"
      }
    },
    "changes": {
      "plan_changed": true,
      "previous_plan": "Pro",
      "new_plan": "Enterprise",
      "price_difference": 30000.00
    }
  },
  "message": "구독이 성공적으로 수정되었습니다."
}
```

**비즈니스 로직**:
1. `subscription_id` 존재 여부 확인
2. 플랜 변경 시:
   - 즉시 변경 (Immediate upgrade)
   - `next_billing_date`는 유지
   - 차액 정산 Invoice 생성 (Pro-rated billing)
3. 상태 변경 시:
   - CANCELED: `end_date` 필수, `next_billing_date` null 처리
   - PAUSED: `next_billing_date` 일시 정지 (다음 청구 건너뜀)
   - ACTIVE: 일시정지 해제, `next_billing_date` 재계산
4. `updated_at` 자동 갱신

**Error Cases**:

```json
// 404 Not Found - 구독 없음
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "해당 구독을 찾을 수 없습니다."
  }
}

// 400 Bad Request - 이미 해지된 구독
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_ALREADY_CANCELED",
    "message": "이미 해지된 구독은 수정할 수 없습니다."
  }
}

// 400 Bad Request - 필수 필드 누락 (CANCELED 시)
{
  "success": false,
  "error": {
    "code": "END_DATE_REQUIRED",
    "message": "구독 해지 시 end_date는 필수입니다."
  }
}
```

---

## 4. 추가 참고용 API (구현 권장)

### GET /api/v1/customers
고객 목록 조회

### GET /api/v1/customers/:id
특정 고객 상세 조회

### GET /api/v1/plans
플랜 목록 조회

### GET /api/v1/subscriptions
구독 목록 조회

### GET /api/v1/subscriptions/:id
특정 구독 상세 조회

---

## 에러 코드 목록

| 코드 | 설명 |
|------|------|
| MISSING_REQUIRED_FIELD | 필수 필드 누락 |
| INVALID_PARAMETER | 잘못된 파라미터 형식 |
| CUSTOMER_NOT_FOUND | 고객을 찾을 수 없음 |
| PLAN_NOT_FOUND | 플랜을 찾을 수 없음 |
| PLAN_NOT_ACTIVE | 플랜이 비활성화됨 |
| SUBSCRIPTION_NOT_FOUND | 구독을 찾을 수 없음 |
| SUBSCRIPTION_ALREADY_CANCELED | 이미 해지된 구독 |
| END_DATE_REQUIRED | 해지일 필수 입력 |
| DATABASE_ERROR | 데이터베이스 오류 |
| INTERNAL_SERVER_ERROR | 서버 내부 오류 |

---

## API 개발 우선순위
1. **필수 (1순위)**: 
   - GET /api/v1/invoices
   - POST /api/v1/subscriptions/add
   - POST /api/v1/subscriptions/modify

2. **권장 (2순위)**:
   - GET /api/v1/customers
   - GET /api/v1/plans
   - GET /api/v1/subscriptions

3. **선택 (3순위)**:
   - PUT /api/v1/invoices/:id (결제 상태 수동 변경)
   - POST /api/v1/customers (고객 추가)