#!/bin/bash

# 멘토-멘티 매칭 앱 백엔드 + 프론트엔드 백그라운드 실행 스크립트
# 자동 평가 및 테스트용

echo "=== 멘토-멘티 매칭 앱 백그라운드 시작 ==="
echo "백엔드 API: http://localhost:8080/api"
echo "프론트엔드: http://localhost:3000"
echo "Swagger UI: http://localhost:8080/swagger-ui"
echo ""

# 1. 백엔드 시작 (백그라운드)
echo "🚀 백엔드 서버 시작 중..."
cd backend

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "가상환경 활성화 중..."
source venv/bin/activate

# 의존성 설치
echo "의존성 설치 중..."
pip install -r requirements.txt > /dev/null 2>&1

# FastAPI 서버 백그라운드 실행
echo "FastAPI 서버를 백그라운드에서 시작합니다..."
nohup uvicorn main:app --host 0.0.0.0 --port 8080 > backend.log 2>&1 &
BACKEND_PID=$!

echo "백엔드 서버 PID: $BACKEND_PID"

# 서버가 시작될 때까지 잠시 대기
echo "백엔드 서버 시작 대기 중..."
sleep 3

# 백엔드 서버 상태 확인
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 백엔드 서버가 성공적으로 시작되었습니다!"
else
    echo "❌ 백엔드 서버 시작에 실패했습니다."
    echo "로그를 확인하세요: cat backend/backend.log"
    exit 1
fi

# 2. 프론트엔드 시작 (백그라운드)
echo ""
echo "🎨 프론트엔드 앱 시작 중..."
cd ../frontend

# Node.js 의존성 설치
echo "Node.js 의존성 설치 중..."
npm install > /dev/null 2>&1

# React 앱 백그라운드 실행
echo "React 개발 서버를 백그라운드에서 시작합니다..."
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "프론트엔드 서버 PID: $FRONTEND_PID"

# 프론트엔드 서버가 시작될 때까지 대기
echo "프론트엔드 서버 시작 대기 중..."
sleep 10

# 프론트엔드 서버 상태 확인 (포트 3000 확인)
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ 프론트엔드 서버가 성공적으로 시작되었습니다!"
else
    echo "❌ 프론트엔드 서버 시작에 실패했습니다."
    echo "로그를 확인하세요: cat frontend/frontend.log"
    # 백엔드 서버도 종료
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 모든 서버가 성공적으로 시작되었습니다!"
echo ""
echo "📊 서비스 URL:"
echo "   • 프론트엔드: http://localhost:3000"
echo "   • 백엔드 API: http://localhost:8080/api"
echo "   • Swagger UI: http://localhost:8080/swagger-ui"
echo ""
echo "📝 로그 파일:"
echo "   • 백엔드: backend/backend.log"
echo "   • 프론트엔드: frontend/frontend.log"
echo ""
echo "🔧 프로세스 ID:"
echo "   • 백엔드 PID: $BACKEND_PID"
echo "   • 프론트엔드 PID: $FRONTEND_PID"
echo ""
echo "🛑 서버를 종료하려면:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   또는 ./stop-all.sh 스크립트를 실행하세요."
