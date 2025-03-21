from flask import Blueprint

# 객체 관리 블루프린트 생성
# - 페이지 접근: /objects/
# - API 접근: /api/objects/
objects_bp = Blueprint('objects', __name__, url_prefix='/objects')

from . import views, api 