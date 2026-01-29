# Subscription Management System

## 프로젝트 개요
고객의 구독(Subscription) 관리 시스템으로, 플랜 관리, 고객 관리, 구독 내역 관리, 청구 내역 조회 기능을 제공합니다.

## 기술 스택
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Docker 사용 권장)
- **Frontend**: React (Vite)
- **API Style**: RESTful API

## 실행 방법

### 1. Database 실행 (Docker 활용)
Docker가 설치되어 있다면 가장 간단하게 데이터베이스를 실행할 수 있습니다.
```bash
docker-compose up -d
```
*설정 정보: 유저 `postgres`, 비밀번호 `postgres`, DB명 `homework`*

### 2. Backend 설정 및 실행
`backend/.env` 파일의 접속 정보가 Docker 설정과 일치하는지 확인 후 실행합니다.
```bash
cd backend
npm install
npm run migrate  # 테이블 생성 및 7개씩의 샘플 데이터 로드
npm run dev      # 서버 실행 (http://localhost:3000)
```

### 3. Frontend 실행
```bash
cd frontend
npm install
npm run dev      # 프론트엔드 실행 (http://localhost:5173)
```

## 기능 요약
- **청구 내역 조회**: 월별, 상태별 필터링 기능 제공.
- **구독 추가/수정**: 신규 구독 시 인보이스 자동 생성 및 플랜 변경 시 차액 계산 로직 포함.
- **예시 데이터**: 각 테이블당 7개 이상의 풍부한 데이터가 기본 포함됩니다.

## 역기획 및 검증
- **DB 데이터 기반 UI**: Invoice, Subscription, Customer, Plan 테이블의 관계를 조인하여 요구사항 전체를 화면에 시각화했습니다.
- **비즈니스 로직**: 업그레이드 시 추가 청구($) 로직 등을 백엔드 트랜잭션으로 안전하게 처리합니다.

## 배포 가이드
자세한 배포 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md) 파일을 참고하세요.
- 추천 플랫폼: Vercel (Frontend), Render (Backend + Database)