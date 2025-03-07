from datetime import datetime
from app import db

class Device(db.Model):
    """장비 기본 정보를 저장하는 모델"""
    id = db.Column(db.Integer, primary_key=True)
    
    # 기본 정보
    name = db.Column(db.String(100), nullable=False, comment='장비명')
    category = db.Column(db.String(20), nullable=False, comment='장비 분류(firewall, proxy, ips 등)')
    manufacturer = db.Column(db.String(50), nullable=False, comment='제조사')
    model = db.Column(db.String(50), nullable=False, comment='모델명')
    version = db.Column(db.String(50), comment='버전 정보')
    
    # 연결 정보
    ip_address = db.Column(db.String(100), nullable=False, comment='IP 주소')
    port = db.Column(db.Integer, default=443, comment='접속 포트')
    username = db.Column(db.String(100), nullable=False, comment='접속 계정')
    password = db.Column(db.String(200), nullable=False, comment='접속 비밀번호')
    
    # 생성/수정 시간
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Device {self.name}>'

    @property
    def connection_string(self):
        """접속 문자열 반환"""
        return f'{self.ip_address}:{self.port}' 