#!/bin/bash

# 멘토-멘티 매칭 앱 백엔드 백그라운드 실행 스크립트
# 자동 평가 및 UI 테스트용

echo "=== 백엔드 API 서버 백그라운드 시작 ==="
echo "포트: 8080"
echo "API 엔드포인트: http://localhost:8080/api"
echo "Swagger UI: http://localhost:8080/swagger-ui"
echo ""

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
pip install -r requirements.txt

# 데이터베이스 초기화 (샘플 데이터 포함)
echo "데이터베이스 초기화 중..."
if ! python init_db.py; then
    echo "❌ 데이터베이스 초기화에 실패했습니다."
    echo "Python 스크립트 실행 중 오류가 발생했습니다."
    exit 1
fi

# FastAPI 서버 백그라운드 실행
echo "FastAPI 서버를 백그라운드에서 시작합니다..."
nohup uvicorn main:app --host 0.0.0.0 --port 8080 > backend.log 2>&1 &
BACKEND_PID=$!

echo "백엔드 서버 PID: $BACKEND_PID"
echo "로그 파일: backend/backend.log"

# 서버가 시작될 때까지 잠시 대기
echo "서버 시작 대기 중..."
sleep 3

# 서버 상태 확인
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 백엔드 서버가 성공적으로 시작되었습니다!"
    echo "🌐 API 엔드포인트: http://localhost:8080/api"
    echo "📊 Swagger UI: http://localhost:8080/swagger-ui"
    echo ""
    echo "서버를 종료하려면 다음 명령어를 사용하세요:"
    echo "kill $BACKEND_PID"
    echo ""
    echo "또는 다음 스크립트를 실행하세요:"
    echo "./stop-backend.sh"
else
    echo "❌ 백엔드 서버 시작에 실패했습니다."
    echo ""
    echo "=== 백엔드 로그 내용 ==="
    if [ -f "backend.log" ]; then
        cat backend.log
    else
        echo "로그 파일을 찾을 수 없습니다."
    fi
    echo "========================"
    echo ""
    exit 1
fi
