# 멘토-멘티 매칭 앱

## 프로젝트 개요
멘토와 멘티를 매칭하는 웹 애플리케이션입니다.

## 기술 스택
- **백엔드**: FastAPI (Python)
- **프론트엔드**: React.js (TypeScript)
- **데이터베이스**: SQLite
- **스타일링**: Material-UI

## 실행 명령어

### 백엔드 실행 (포트 8080)

**포그라운드 실행 (개발용):**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

또는 스크립트 사용:
```bash
./start-backend.sh
```

**백그라운드 실행 (테스트용):**
```bash
./start-backend-bg.sh
```

**백그라운드 서버 종료:**
```bash
./stop-backend.sh
```

### 프론트엔드 실행 (포트 3000)
```bash
cd frontend
npm install
npm start
```

또는 스크립트 사용:
```bash
./start-frontend.sh
```

### 전체 앱 실행 (백엔드 + 프론트엔드)
```bash
./start-app.sh
```

### 백엔드 테스트 실행
```bash
cd backend
source venv/bin/activate
pytest
```

## 접속 URL
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui
- **OpenAPI 문서**: http://localhost:8080/openapi.json

## 자동 평가를 위한 명령어

### API 테스트용 백엔드 실행
```bash
cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8080
```

### UI 테스트용 프론트엔드+백엔드 실행

터미널 1 (백엔드):
```bash
cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8080
```

터미널 2 (프론트엔드):
```bash
cd frontend && npm install && npm start
```

## 개발 환경
- Python 3.12+
- Node.js 18+
- npm 또는 yarn

## 주요 기능
- 회원가입/로그인 (JWT 인증)
- 멘토/멘티 프로필 관리
- 멘토 검색 및 필터링
- 매칭 요청 시스템
- 반응형 웹 디자인

## 테스트 커버리지
- 인증 API 테스트
- 프로필 관리 테스트
- 매칭 요청 테스트
- 보안 테스트
