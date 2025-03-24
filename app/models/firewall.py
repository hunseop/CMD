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

# 동기화 상태 및 우선순위 상수 정의
SYNC_STATUS = {
    'PENDING': 'pending',      # 대기 중
    'RUNNING': 'running',      # 실행 중
    'COMPLETED': 'completed',  # 완료됨
    'FAILED': 'failed',        # 실패함
    'CANCELED': 'canceled'     # 취소됨
}

SYNC_PRIORITY = {
    'HIGH': 1,     # 높은 우선순위
    'NORMAL': 2,   # 일반 우선순위
    'LOW': 3       # 낮은 우선순위
}

class SyncTask(db.Model):
    """동기화 작업 관리 모델"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=False)
    device = db.relationship('Device', backref='sync_tasks')
    
    # 작업 정보
    task_name = db.Column(db.String(100), nullable=False, comment='작업명(예: 방화벽 정책 동기화)')
    sync_types = db.Column(db.Text, nullable=False, comment='동기화 유형 목록(쉼표로 구분)')
    
    # 작업 상태
    status = db.Column(db.String(20), default=SYNC_STATUS['PENDING'], comment='상태(pending, running, completed, failed, canceled)')
    progress = db.Column(db.Integer, default=0, comment='진행률(0-100)')
    current_sync_type = db.Column(db.String(50), nullable=True, comment='현재 동기화 중인 유형')
    message = db.Column(db.Text, nullable=True, comment='상태 메시지')
    
    # 우선순위 (낮은 숫자가 높은 우선순위)
    priority = db.Column(db.Integer, default=SYNC_PRIORITY['NORMAL'], comment='우선순위(1: 높음, 2: 보통, 3: 낮음)')
    
    # 시간 관련 필드
    queue_position = db.Column(db.Integer, default=0, comment='큐에서의 위치(0: 실행 중)')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='생성 시간')
    started_at = db.Column(db.DateTime, nullable=True, comment='시작 시간')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='마지막 업데이트 시간')
    completed_at = db.Column(db.DateTime, nullable=True, comment='완료 시간')
    
    # 배치 관련 필드
    batch_id = db.Column(db.String(36), nullable=True, comment='배치 작업 ID')
    is_batch = db.Column(db.Boolean, default=False, comment='배치 작업 여부')
    
    def __repr__(self):
        return f'<SyncTask {self.task_name} for device_id={self.device_id}, status={self.status}>'
    
    @property
    def elapsed_time(self):
        """작업 소요 시간 계산 (초 단위)"""
        if not self.started_at:
            return 0
            
        end_time = self.completed_at or datetime.now()
        return (end_time - self.started_at).total_seconds()
    
    @property
    def elapsed_time_formatted(self):
        """소요 시간을 mm:ss 형식으로 반환"""
        seconds = int(self.elapsed_time)
        minutes, seconds = divmod(seconds, 60)
        return f"{minutes:02d}:{seconds:02d}"
    
    @property
    def is_active(self):
        """작업이 활성 상태인지 여부"""
        return self.status in [SYNC_STATUS['PENDING'], SYNC_STATUS['RUNNING']]
    
    @property
    def can_cancel(self):
        """작업 취소 가능 여부"""
        return self.status in [SYNC_STATUS['PENDING'], SYNC_STATUS['RUNNING']] 