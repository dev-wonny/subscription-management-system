# Deployment Guide

본 프로젝트는 Frontend(React), Backend(Node.js), Database(PostgreSQL)로 구성되어 있습니다. 가장 빠르고 안정적으로 배포할 수 있는 추천 조합을 안내해 드립니다.

## 추천 조합: Vercel (Frontend) + Render (Backend + Database)

이 조합은 설정이 간편하고 무료 티어를 제공하여 테스트 배포에 최적화되어 있습니다.

### 1. Database 및 Backend 배포 (Render.com)

1.  **Render.com**에 로그인하여 'New' -> **PostgreSQL**을 생성합니다.
2.  데이터베이스가 생성되면 `Internal Database URL` 또는 `External Database URL`을 복사해 둡니다.
3.  'New' -> **Web Service**를 선택하고 백엔드 리포지토리를 연결합니다 (또는 소스 코드 업로드).
4.  설정(Settings):
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
5.  환경 변수(Environment Variables) 설정:
    *   `DATABASE_URL`: 2번에서 복사한 URL
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000` (기본값)

### 2. Frontend 배포 (Vercel.com)

1.  **Vercel.com**에 로그인하여 프론트엔드 프로젝트를 임포트합니다.
2.  설정(Settings):
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  환경 변수(Environment Variables) 설정:
    *   `VITE_API_BASE_URL`: 1단계에서 생성된 백엔드 서비스의 URL (예: `https://your-backend.onrender.com`)

### 3. 데이터베이스 초기화 (Initial Migration)

배포된 백엔드 서비스의 터미널이나 로컬에서 배포된 DB로 연결하여 초기 데이터를 넣어줘야 합니다.
로컬 환경 변수의 `DATABASE_URL`을 배포용 URL로 임시 변경한 뒤 실행하세요.

```bash
cd backend
# .env의 DATABASE_URL 수정 후
npm run migrate
```

---

## 대안: Railway.app (All-in-one)

Docker Compose를 지원하므로 현재의 구조를 거의 그대로 배포할 수 있습니다.

1.  Railway에 프로젝트 리포지토리를 연결하면 `docker-compose.yml`을 감지하여 자동으로 DB와 App 컨테이너를 생성합니다.
2.  백엔드와 프론트엔드의 연결을 위해 환경 변수만 적절히 설정해주면 됩니다.

## 체크리스트 (운영 환경 적용 시)
- [ ] 패스워드 및 토큰 정보는 반드시 환경 변수(`.env`)로 관리하세요.
- [ ] CORS 설정을 실제 프론트엔드 도메인으로 제한하세요 (`backend/index.js`).
- [ ] 운영 환경에서는 `Adminer` 서비스를 비활성화하거나 비밀번호를 강화하세요.
