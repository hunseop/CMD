from flask import Blueprint

# 블루프린트 정의
devices_bp = Blueprint('devices', __name__, url_prefix='/devices')

# 각 모듈에서 라우트 등록
from app.routes.devices import views, crud, excel, sync

# 외부에서 사용할 블루프린트 노출
__all__ = ['devices_bp'] 