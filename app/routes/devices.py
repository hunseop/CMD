"""
이 모듈은 이전 버전과의 호환성을 위해 유지됩니다.
새로운 코드에서는 app.routes.devices 패키지를 직접 사용하세요.
"""

# 새 모듈에서 블루프린트 가져오기
from app.routes.devices import devices_bp

# 이전 버전과의 호환성을 위해 블루프린트를 그대로 노출
__all__ = ['devices_bp'] 