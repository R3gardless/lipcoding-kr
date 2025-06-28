#!/bin/bash

# 멘토-멘티 매칭 앱 프론트엔드 백그라운드 실행 스크립트
# 자동 평가 및 UI 테스트용

echo "=== 프론트엔드 React 서버 백그라운드 시작 ==="
echo "포트: 3000"
echo "프론트엔드 URL: http://localhost:3000"
echo ""

# Node.js 버전 확인
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 먼저 설치해주세요: https://nodejs.org/"
    exit 1
fi

# npm 의존성 설치
if [ ! -d "node_modules" ]; then
    echo "Node.js 의존성 설치 중..."
    npm install > /dev/null 2>&1
else
    echo "의존성 확인 중..."
    npm install > /dev/null 2>&1
fi

# React 서버 백그라운드 실행
echo "React 서버를 백그라운드에서 시작합니다..."
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "프론트엔드 서버 PID: $FRONTEND_PID"
echo "로그 파일: frontend/frontend.log"

# 서버가 시작될 때까지 잠시 대기
echo "서버 시작 대기 중..."
sleep 5

# 서버 상태 확인
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ 프론트엔드 서버가 성공적으로 시작되었습니다!"
    echo "🌐 웹 애플리케이션: http://localhost:3000"
    echo ""
    echo "서버를 종료하려면 다음 명령어를 사용하세요:"
    echo "kill $FRONTEND_PID"
    echo ""
    echo "또는 다음 스크립트를 실행하세요:"
    echo "./stop-frontend.sh"
else
    echo "❌ 프론트엔드 서버 시작에 실패했습니다."
    echo "로그를 확인하세요: cat frontend/frontend.log"
    exit 1
fi
