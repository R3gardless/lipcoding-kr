#!/bin/bash

# 멘토-멘티 매칭 앱 프론트엔드 서버 종료 스크립트

echo "=== 프론트엔드 React 서버 종료 ==="

# 포트 3000에서 실행 중인 프로세스 찾기
FRONTEND_PID=$(lsof -ti:3000)

if [ -z "$FRONTEND_PID" ]; then
    echo "ℹ️  포트 3000에서 실행 중인 프로세스가 없습니다."
else
    echo "포트 3000에서 실행 중인 프로세스를 종료합니다..."
    kill $FRONTEND_PID
    
    # 프로세스가 완전히 종료될 때까지 대기
    sleep 2
    
    # 종료 확인
    if ! lsof -ti:3000 > /dev/null; then
        echo "✅ 프론트엔드 서버가 성공적으로 종료되었습니다."
    else
        echo "⚠️  프로세스가 아직 실행 중입니다. 강제 종료를 시도합니다..."
        kill -9 $FRONTEND_PID
        echo "✅ 프론트엔드 서버가 강제 종료되었습니다."
    fi
fi

# 로그 파일 정리 여부 확인
if [ -f "frontend/frontend.log" ]; then
    echo ""
    read -p "로그 파일(frontend/frontend.log)을 삭제하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm frontend/frontend.log
        echo "✅ 로그 파일이 삭제되었습니다."
    fi
fi

echo "프론트엔드 서버 종료 완료."
