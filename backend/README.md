# Mentor-Mentee Matching App Backend

## FastAPI 기반 백엔드 서버

### 기능
- JWT 인증 시스템
- 사용자 회원가입/로그인
- 프로필 관리 (이미지 업로드 포함)
- 멘토 목록 조회 및 필터링
- 매칭 요청 시스템
- SQLite 데이터베이스

### 실행 방법

```bash
# 백엔드 디렉토리로 이동
cd backend

# 시작 스크립트 실행
./start.sh
```

또는 수동으로:

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### API 문서
- Swagger UI: http://localhost:8080/swagger-ui
- OpenAPI JSON: http://localhost:8080/openapi.json

### 주요 엔드포인트
- `POST /api/signup` - 회원가입
- `POST /api/login` - 로그인
- `GET /api/me` - 내 정보 조회
- `PUT /api/profile` - 프로필 수정
- `GET /api/mentors` - 멘토 목록 조회
- `POST /api/match-requests` - 매칭 요청 생성
- `GET /api/match-requests/incoming` - 받은 요청 목록
- `GET /api/match-requests/outgoing` - 보낸 요청 목록

### 데이터베이스
- SQLite 데이터베이스 파일: `mentor_mentee.db`
- 테이블: `users`, `match_requests`

### 보안 기능
- JWT 토큰 인증
- 비밀번호 해싱 (bcrypt)
- 이미지 파일 검증
- SQL 인젝션 방지
- CORS 설정
