#!/bin/bash

# 백엔드 테스트 실행 스크립트

echo "🔧 가상환경 활성화 중..."
source venv/bin/activate

echo "📦 의존성 설치 중..."
pip install -r requirements.txt

echo "🧪 pytest 테스트 실행 중..."
pytest -v --cov=main --cov-report=html --cov-report=term-missing

echo "📊 테스트 커버리지 리포트가 htmlcov/ 디렉토리에 생성되었습니다."
echo "✅ 테스트 완료!"

# 커버리지 결과 요약 출력
echo ""
echo "=== 테스트 커버리지 요약 ==="
coverage report --show-missing
