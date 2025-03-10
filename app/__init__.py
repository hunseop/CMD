from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    from app.routes.devices import devices_bp
    app.register_blueprint(devices_bp)
    
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