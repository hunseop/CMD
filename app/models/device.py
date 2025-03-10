from datetime import datetime
from app import db
from sqlalchemy.orm import validates

# 유효한 장비 타입과 세부 타입 정의
VALID_CATEGORIES = ['firewall']
VALID_SUBCATEGORIES = {
    'firewall': ['paloalto', 'mf2', 'ngf', 'mock']
}

class Device(db.Model):
    """장비 기본 정보를 저장하는 모델"""
    id = db.Column(db.Integer, primary_key=True)
    
    # 기본 정보
    name = db.Column(db.String(100), nullable=False, comment='장비명')
    category = db.Column(db.String(20), nullable=False, comment='장비 분류(firewall)')
    sub_category = db.Column(db.String(20), nullable=False, comment='세부 분류(paloalto, mf2, ngf, mock)')
    manufacturer = db.Column(db.String(50), nullable=True, comment='제조사')
    model = db.Column(db.String(50), nullable=True, comment='모델명')
    version = db.Column(db.String(50), nullable=True, comment='버전 정보')
    
    # 연결 정보
    ip_address = db.Column(db.String(100), nullable=False, unique=True, comment='IP 주소')
    port = db.Column(db.Integer, default=443, comment='접속 포트')
    username = db.Column(db.String(100), nullable=False, comment='접속 계정')
    password = db.Column(db.String(200), nullable=False, comment='접속 비밀번호')
    
    # 생성/수정 시간
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @validates('category')
    def validate_category(self, key, category):
        if category not in VALID_CATEGORIES:
            raise ValueError(f"유효하지 않은 장비 분류입니다. 가능한 값: {', '.join(VALID_CATEGORIES)}")
        return category
    
    @validates('sub_category')
    def validate_sub_category(self, key, sub_category):
        if hasattr(self, 'category') and self.category in VALID_SUBCATEGORIES:
            if sub_category not in VALID_SUBCATEGORIES[self.category]:
                raise ValueError(f"'{self.category}' 분류에서 유효하지 않은 세부 분류입니다. 가능한 값: {', '.join(VALID_SUBCATEGORIES[self.category])}")
        return sub_category

    def __repr__(self):
        return f'<Device {self.name} ({self.category}/{self.sub_category})>'

    @property
    def connection_string(self):
        """접속 문자열 반환"""
        return f'{self.ip_address}:{self.port}'
    
    def get_connection_config(self):
        """장비 타입에 맞는 연결 설정 반환"""
        if self.sub_category == 'paloalto' or self.sub_category == 'mock':
            return {
                'hostname': self.ip_address,
                'username': self.username,
                'password': self.password
            }
        elif self.sub_category == 'mf2':
            return {
                'device_ip': self.ip_address,
                'username': self.username,
                'password': self.password
            }
        elif self.sub_category == 'ngf':
            return {
                'hostname': self.ip_address,
                'ext_clnt_id': self.username,  # NGF는 username을 ext_clnt_id로 사용
                'ext_clnt_secret': self.password  # NGF는 password를 ext_clnt_secret로 사용
            }
        return None 