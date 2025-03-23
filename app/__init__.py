from flask import Flask, request
from datetime import datetime, timedelta
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # 설정 로드
    app.config.from_object('config.Config')
    
    # 정적 파일 캐시 비활성화
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    
    # 데이터베이스 초기화
    db.init_app(app)
    migrate.init_app(app, db)
    
    # 블루프린트 등록
    from app.routes.main import main_bp
    from app.routes.devices import devices_bp  # 이제 이것은 app/routes/devices/__init__.py를 가리킵니다
    from app.routes.policies import policies_bp
    from app.routes.objects import objects_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(policies_bp)
    app.register_blueprint(objects_bp)
    
    return app

# 모델 임포트는 circular import를 피하기 위해 create_app 함수 정의 후에 작성
from app.models import (
    Device,
    FirewallSystemInfo,
    FirewallPolicy,
    FirewallNetworkObject,
    FirewallNetworkGroup,
    FirewallServiceObject,
    FirewallServiceGroup,
    SyncHistory
)