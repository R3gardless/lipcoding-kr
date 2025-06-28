# Mentor-Mentee Matching App Development Guide

## 프로젝트 개요

이 프로젝트는 멘토와 멘티를 매칭하는 웹 애플리케이션입니다. 멘토는 자신의 기술 스택과 소개를 등록하고, 멘티는 원하는 멘토에게 매칭 요청을 보낼 수 있는 시스템입니다.

## 기술 스택 요구사항

- **언어**: Python
- **프론트엔드**: React.js (포트 3000)
- **백엔드**: FastAPI (포트 8080)
- **데이터베이스**: SQLite
- **백엔드 테스트**: pytest 기반 완전한 테스트 코드 작성 필수
- **프론트엔드 스타일링**: 외부 CSS 라이브러리 사용 (Material-UI, Tailwind CSS, Bootstrap 등)
- **프론트엔드 반응형**: 모바일, 태블릿, 데스크톱 대응

## 필수 URL 구조

```
프론트엔드: http://localhost:3000
백엔드: http://localhost:8080
API 엔드포인트: http://localhost:8080/api/*
Swagger UI: http://localhost:8080/swagger-ui
OpenAPI 문서: http://localhost:8080/openapi.json
```

## 핵심 기능 구현

### 1. 인증 시스템
- **회원가입**: 이메일, 비밀번호, 이름, 역할(mentor/mentee)
- **로그인**: JWT 토큰 발급 (1시간 유효)
- **JWT 클레임**: `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`, `name`, `email`, `role`

### 2. 사용자 프로필
- **멘토**: 이름, 소개글, 프로필 이미지, 기술 스택
- **멘티**: 이름, 소개글, 프로필 이미지
- **기본 이미지**: 
  - 멘토: `https://placehold.co/500x500.jpg?text=MENTOR`
  - 멘티: `https://placehold.co/500x500.jpg?text=MENTEE`

### 3. 멘토 검색/정렬 (멘티 전용)
- 기술 스택으로 필터링
- 이름 또는 기술 스택으로 정렬

### 4. 매칭 요청 시스템
- **멘티**: 멘토에게 요청 전송 (메시지 포함)
- **멘토**: 요청 수락/거절 (한 번에 한 명만)
- **상태**: pending, accepted, rejected, cancelled

## API 엔드포인트

### 인증
- `POST /api/signup` - 회원가입
- `POST /api/login` - 로그인

### 프로필
- `GET /api/me` - 내 정보 조회
- `PUT /api/profile` - 프로필 수정
- `GET /api/images/:role/:id` - 프로필 이미지

### 멘토 관리
- `GET /api/mentors` - 멘토 목록 (쿼리: skill, order_by)

### 매칭 요청
- `POST /api/match-requests` - 요청 생성
- `GET /api/match-requests/incoming` - 받은 요청 (멘토)
- `GET /api/match-requests/outgoing` - 보낸 요청 (멘티)
- `PUT /api/match-requests/:id/accept` - 요청 수락
- `PUT /api/match-requests/:id/reject` - 요청 거절
- `DELETE /api/match-requests/:id` - 요청 취소

## 필수 HTML Element IDs (테스트용)

### 회원가입/로그인
```html
<input id="email" />
<input id="password" />
<input id="role" />
<button id="signup" />
<button id="login" />
```

### 프로필
```html
<input id="name" />
<input id="bio" />
<input id="skillsets" />
<img id="profile-photo" />
<input id="profile" type="file" />
<button id="save" />
```

### 멘토 목록
```html
<div class="mentor" />
<input id="search" />
<input id="name" type="radio" />
<input id="skill" type="radio" />
```

### 매칭 요청
```html
<input id="message" data-mentor-id="{{mentor-id}}" data-testid="message-{{mentor-id}}" />
<div id="request-status" />
<button id="request" />
<div class="request-message" mentee="{{mentee-id}}" />
<button id="accept" />
<button id="reject" />
```

## 페이지 라우팅

- `/` - 루트 (인증 상태에 따라 리다이렉트)
- `/signup` - 회원가입
- `/login` - 로그인
- `/profile` - 프로필 관리
- `/mentors` - 멘토 목록 (멘티만)
- `/requests` - 요청 관리

## 보안 요구사항

- SQL 인젝션 방지
- XSS 공격 방지
- OWASP Top 10 대응
- JWT 토큰 검증
- 파일 업로드 검증 (.jpg/.png, 500x500~1000x1000px, 최대 1MB)

## 데이터베이스 설계

### Users 테이블
```sql
id, email, password_hash, name, role, bio, image_data, skills, created_at
```

### MatchRequests 테이블
```sql
id, mentor_id, mentee_id, message, status, created_at, updated_at
```

## 비즈니스 로직

1. **멘토 제약**: 한 번에 한 명의 멘티만 수락 가능
2. **멘티 제약**: 대기 중인 요청이 있으면 다른 요청 불가
3. **상태 관리**: pending → accepted/rejected/cancelled

## 개발 우선순위

1. 백엔드 API 구현 (OpenAPI 명세 기반)
2. 백엔드 완전한 테스트 코드 작성 (pytest 사용)
3. 데이터베이스 모델링
4. JWT 인증 시스템
5. 프론트엔드 UI 구현 (외부 CSS 라이브러리 + 반응형)
6. 매칭 요청 시스템
7. 테스트 및 보안 강화

## 백엔드 테스트 요구사항

### 필수 테스트 커버리지
- **인증 테스트**: 회원가입, 로그인, JWT 토큰 검증
- **프로필 테스트**: 프로필 조회, 수정, 이미지 업로드
- **멘토 검색 테스트**: 목록 조회, 필터링, 정렬
- **매칭 요청 테스트**: 요청 생성, 수락/거절, 상태 변경
- **에러 핸들링 테스트**: 400, 401, 404, 500 응답 검증
- **보안 테스트**: SQL 인젝션, XSS 방지 검증

### 테스트 도구
```python
# requirements.txt에 추가
pytest==7.4.0
pytest-asyncio==0.21.1
httpx==0.24.1
pytest-cov==4.1.0
```

### 테스트 구조
```
backend/
  tests/
    conftest.py          # 테스트 설정 및 픽스처
    test_auth.py         # 인증 관련 테스트
    test_profile.py      # 프로필 관련 테스트
    test_mentors.py      # 멘토 검색 테스트
    test_match_requests.py # 매칭 요청 테스트
    test_security.py     # 보안 테스트
```

## 프론트엔드 스타일링 요구사항

### 외부 CSS 라이브러리 (선택 사항)
- **Material-UI (MUI)**: React 컴포넌트 기반
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Bootstrap**: 검증된 반응형 프레임워크
- **Ant Design**: 엔터프라이즈급 UI 컴포넌트

### 반응형 디자인 요구사항

#### 브레이크포인트
```css
/* 모바일 */
@media (max-width: 768px) {
  /* 세로 정렬, 풀 폭 컴포넌트 */
}

/* 태블릿 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 그리드 2열, 적절한 여백 */
}

/* 데스크톱 */
@media (min-width: 1025px) {
  /* 그리드 3-4열, 최대 폭 제한 */
}
```

#### 필수 반응형 요소
- **네비게이션**: 모바일에서 햄버거 메뉴
- **멘토 카드**: 모바일(1열), 태블릿(2열), 데스크톱(3-4열)
- **프로필 폼**: 모바일에서 세로 정렬
- **이미지**: 컨테이너에 맞는 크기 조정
- **폰트 크기**: 화면 크기에 따른 적응형 크기

#### UI/UX 가이드라인
- **터치 친화적**: 최소 44px 터치 영역
- **로딩 상태**: 스피너 또는 스켈레톤 UI
- **에러 상태**: 사용자 친화적 에러 메시지
- **성공 상태**: 토스트 또는 알림 메시지

## 평가 기준

- **API 테스트 통과** (자동화된 테스트)
- **백엔드 테스트 코드 품질** (pytest 기반 완전한 테스트 커버리지)
- **UI 테스트 통과** (Selenium 기반)
- **반응형 디자인** (모바일, 태블릿, 데스크톱 대응)
- **외부 CSS 라이브러리 활용도**
- **요구사항 준수도**
- **코드 품질 및 보안**

## 제출 요구사항

- GitHub 리포지토리 제출
- 실행 명령어 제공
- 3시간 제한시간 내 완성
- **백엔드 완전한 테스트 코드 포함** (pytest 기반)
- **프론트엔드 반응형 디자인 구현** (외부 CSS 라이브러리 사용)
- API 및 UI 테스트 통과 필수

## 참고 문헌

이 개발 가이드는 다음 문서들을 참고하여 작성되었습니다:

- [API 명세서](../mentor-mentee-api-spec.md) - 백엔드 API 엔드포인트 상세 명세
- [평가 기준](../mentor-mentee-app-assessment.md) - 앱 평가 방법 및 기준
- [개발 요구사항](../mentor-mentee-app-requirements.md) - 기술적 요구사항 및 제약사항
- [사용자 스토리](../mentor-mentee-app-user-stories.md) - 기능별 사용자 스토리 및 테스트 요구사항