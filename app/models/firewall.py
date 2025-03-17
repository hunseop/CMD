from datetime import datetime
from app import db

class FirewallSystemInfo(db.Model):
    """방화벽 시스템 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False, unique=True)
    device = db.relationship('Device', backref=db.backref('system_info', uselist=False))
    
    # 공통 정보
    hostname = db.Column(db.String(100), nullable=True, comment='호스트명')
    model = db.Column(db.String(100), nullable=True, comment='모델명')
    version = db.Column(db.String(100), nullable=True, comment='소프트웨어 버전')
    uptime = db.Column(db.String(100), nullable=True, comment='가동 시간')
    
    # PaloAlto 특화 정보
    ip_address = db.Column(db.String(100), nullable=True, comment='IP 주소 (PaloAlto)')
    mac_address = db.Column(db.String(100), nullable=True, comment='MAC 주소 (PaloAlto)')
    serial_number = db.Column(db.String(100), nullable=True, comment='시리얼 번호 (PaloAlto)')
    app_version = db.Column(db.String(100), nullable=True, comment='앱 버전 (PaloAlto)')
    
    # Mock 특화 정보
    status = db.Column(db.String(100), nullable=True, comment='상태 (Mock)')
    
    # 동기화 정보
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallSystemInfo for device_id={self.device_id}>'

class FirewallPolicy(db.Model):
    """방화벽 보안 규칙 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='firewall_policies')
    
    # 기본 정보 (모든 방화벽 타입 공통)
    rule_name = db.Column(db.String(100), nullable=False, comment='규칙 이름')
    seq = db.Column(db.Integer, nullable=True, comment='규칙 순서')
    enable = db.Column(db.String(10), nullable=True, comment='활성화 여부(Y/N)')
    action = db.Column(db.String(20), nullable=True, comment='동작(allow, deny 등)')
    source = db.Column(db.Text, nullable=True, comment='출발지')
    destination = db.Column(db.Text, nullable=True, comment='목적지')
    service = db.Column(db.Text, nullable=True, comment='서비스')
    description = db.Column(db.Text, nullable=True, comment='설명')
    
    # 일부 방화벽 타입에서 사용하는 필드
    user = db.Column(db.Text, nullable=True, comment='사용자 (PaloAlto, NGF, MF2, Mock)')
    application = db.Column(db.Text, nullable=True, comment='애플리케이션 (PaloAlto, NGF, MF2, Mock)')
    
    # PaloAlto 특화 필드
    vsys = db.Column(db.String(20), nullable=True, comment='가상 시스템 (PaloAlto)')
    security_profile = db.Column(db.Text, nullable=True, comment='보안 프로필 (PaloAlto)')
    category = db.Column(db.Text, nullable=True, comment='카테고리 (PaloAlto)')
    
    # 사용 이력
    last_hit_date = db.Column(db.String(50), nullable=True, comment='마지막 사용 일시')
    unused_days = db.Column(db.Integer, nullable=True, comment='미사용 일수')
    usage_status = db.Column(db.String(20), nullable=True, comment='미사용여부(사용/미사용)')
    
    # 동기화 정보
    firewall_type = db.Column(db.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)')
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallPolicy {self.rule_name} for device_id={self.device_id}>'

class FirewallNetworkObject(db.Model):
    """방화벽 네트워크 객체 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='network_objects')
    
    # 객체 정보 (모든 방화벽 타입 공통)
    name = db.Column(db.String(100), nullable=False, comment='객체 이름')
    type = db.Column(db.String(20), nullable=False, comment='객체 타입(ip-netmask, ip-range, fqdn 등)')
    value = db.Column(db.Text, nullable=False, comment='객체 값')
    
    # 동기화 정보
    firewall_type = db.Column(db.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)')
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallNetworkObject {self.name} for device_id={self.device_id}>'

class FirewallNetworkGroup(db.Model):
    """방화벽 네트워크 그룹 객체 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='network_groups')
    
    # 그룹 정보 (모든 방화벽 타입 공통)
    group_name = db.Column(db.String(100), nullable=False, comment='그룹 이름')
    entry = db.Column(db.Text, nullable=False, comment='멤버 목록(콤마로 구분)')
    
    # 동기화 정보
    firewall_type = db.Column(db.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)')
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallNetworkGroup {self.group_name} for device_id={self.device_id}>'

class FirewallServiceObject(db.Model):
    """방화벽 서비스 객체 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='service_objects')
    
    # 객체 정보 (모든 방화벽 타입 공통)
    name = db.Column(db.String(100), nullable=False, comment='객체 이름')
    protocol = db.Column(db.String(20), nullable=False, comment='프로토콜(tcp, udp, icmp 등)')
    port = db.Column(db.String(100), nullable=True, comment='포트 정보')
    
    # 동기화 정보
    firewall_type = db.Column(db.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)')
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallServiceObject {self.name} for device_id={self.device_id}>'

class FirewallServiceGroup(db.Model):
    """방화벽 서비스 그룹 객체 정보"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='service_groups')
    
    # 그룹 정보 (모든 방화벽 타입 공통)
    group_name = db.Column(db.String(100), nullable=False, comment='그룹 이름')
    entry = db.Column(db.Text, nullable=False, comment='멤버 목록(콤마로 구분)')
    
    # 동기화 정보
    firewall_type = db.Column(db.String(20), nullable=False, comment='방화벽 타입(paloalto, mf2, ngf, mock)')
    last_sync_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<FirewallServiceGroup {self.group_name} for device_id={self.device_id}>'

class SyncHistory(db.Model):
    """장비 정책/객체 동기화 이력"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='sync_histories')
    
    sync_type = db.Column(db.String(50), nullable=False, comment='동기화 유형(security_rules, network_objects 등)')
    status = db.Column(db.String(20), nullable=False, comment='상태(success, failed)')
    message = db.Column(db.Text, nullable=True, comment='결과 메시지')
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # 배치 동기화 관련 필드 추가
    is_batch = db.Column(db.Boolean, default=False, comment='배치 동기화 여부')
    batch_id = db.Column(db.String(36), nullable=True, comment='배치 동기화 ID (UUID)')
    
    def __repr__(self):
        return f'<SyncHistory {self.sync_type} for device_id={self.device_id} at {self.created_at}>' 