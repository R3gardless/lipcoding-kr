#!/bin/bash

# 멘토-멘티 매칭 앱 전체 서버 종료 스크립트

echo "=== 백엔드 + 프론트엔드 서버 종료 ==="

# 백엔드 서버 종료
echo "1. 백엔드 서버 종료 중..."
BACKEND_PID=$(lsof -ti:8080)
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    echo "   ✅ 백엔드 서버 종료됨 (PID: $BACKEND_PID)"
else
    echo "   ℹ️  백엔드 서버가 실행 중이지 않습니다."
fi

# 프론트엔드 서버 종료
echo "2. 프론트엔드 서버 종료 중..."
FRONTEND_PID=$(lsof -ti:3000)
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo "   ✅ 프론트엔드 서버 종료됨 (PID: $FRONTEND_PID)"
else
    echo "   ℹ️  프론트엔드 서버가 실행 중이지 않습니다."
fi

# 프로세스가 완전히 종료될 때까지 대기
sleep 3

# 강제 종료가 필요한지 확인
REMAINING_BACKEND=$(lsof -ti:8080)
REMAINING_FRONTEND=$(lsof -ti:3000)

if [ ! -z "$REMAINING_BACKEND" ] || [ ! -z "$REMAINING_FRONTEND" ]; then
    echo "⚠️  일부 프로세스가 아직 실행 중입니다. 강제 종료를 시도합니다..."
    
    if [ ! -z "$REMAINING_BACKEND" ]; then
        kill -9 $REMAINING_BACKEND
        echo "   ✅ 백엔드 서버 강제 종료됨"
    fi
    
    if [ ! -z "$REMAINING_FRONTEND" ]; then
        kill -9 $REMAINING_FRONTEND
        echo "   ✅ 프론트엔드 서버 강제 종료됨"
    fi
fi

echo ""
echo "✅ 모든 서버가 종료되었습니다."
echo ""

# 로그 파일 정리 여부 확인
LOG_FILES=()
[ -f "backend/backend.log" ] && LOG_FILES+=("backend/backend.log")
[ -f "frontend/frontend.log" ] && LOG_FILES+=("frontend/frontend.log")

if [ ${#LOG_FILES[@]} -gt 0 ]; then
    echo "발견된 로그 파일:"
    printf '  - %s\n' "${LOG_FILES[@]}"
    echo ""
    read -p "모든 로그 파일을 삭제하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for log_file in "${LOG_FILES[@]}"; do
            rm "$log_file"
            echo "   ✅ $log_file 삭제됨"
        done
    fi
fi

echo "서버 종료 완료."
