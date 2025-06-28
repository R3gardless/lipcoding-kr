#!/bin/bash

# 멘토-멘티 매칭 앱 백엔드 서버 종료 스크립트

echo "=== 백엔드 FastAPI 서버 종료 ==="

# 포트 8080에서 실행 중인 프로세스 찾기
BACKEND_PID=$(lsof -ti:8080)

if [ -z "$BACKEND_PID" ]; then
    echo "ℹ️  포트 8080에서 실행 중인 프로세스가 없습니다."
else
    echo "포트 8080에서 실행 중인 프로세스를 종료합니다..."
    kill $BACKEND_PID
    
    # 프로세스가 완전히 종료될 때까지 대기
    sleep 2
    
    # 종료 확인
    if ! lsof -ti:8080 > /dev/null; then
        echo "✅ 백엔드 서버가 성공적으로 종료되었습니다."
    else
        echo "⚠️  프로세스가 아직 실행 중입니다. 강제 종료를 시도합니다..."
        kill -9 $BACKEND_PID
        echo "✅ 백엔드 서버가 강제 종료되었습니다."
    fi
fi

# 로그 파일 정리 여부 확인
if [ -f "backend/backend.log" ]; then
    echo ""
    read -p "로그 파일(backend/backend.log)을 삭제하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm backend/backend.log
        echo "✅ 로그 파일이 삭제되었습니다."
    fi
fi

echo "백엔드 서버 종료 완료."
