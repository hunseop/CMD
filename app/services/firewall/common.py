from app import db
from app.models import Device, SyncHistory
from app.firewall_module.collector_factory import FirewallCollectorFactory
import uuid

def get_device_and_collector(device_id):
    """장비 정보와 수집기를 가져옵니다.
    
    Args:
        device_id: 장비 ID
        
    Returns:
        tuple: (device, collector) 또는 (None, None, error_message)
    """
    device = Device.query.get(device_id)
    if not device or device.category != 'firewall':
        return None, None, "유효한 방화벽 장비가 아닙니다."
    
    try:
        # 방화벽 Collector 생성
        collector = FirewallCollectorFactory.get_collector(
            device.sub_category,
            **device.get_connection_config()
        )
        return device, collector, None
    except Exception as e:
        return None, None, f"수집기 생성 중 오류 발생: {str(e)}"

def create_sync_history(device_id, sync_type, status, message, is_batch=False, batch_id=None):
    """동기화 이력을 생성합니다.
    
    Args:
        device_id: 장비 ID
        sync_type: 동기화 유형
        status: 상태 (success/failed)
        message: 메시지
        is_batch: 배치 동기화 여부
        batch_id: 배치 동기화 ID
    
    Returns:
        SyncHistory: 생성된 동기화 이력 객체
    """
    sync_history = SyncHistory(
        device_id=device_id,
        sync_type=sync_type,
        status=status,
        message=message,
        is_batch=is_batch,
        batch_id=batch_id
    )
    db.session.add(sync_history)
    return sync_history

def generate_batch_id():
    """배치 동기화 ID를 생성합니다.
    
    Returns:
        str: UUID 문자열
    """
    return str(uuid.uuid4())

def handle_sync_exception(device_id, sync_type, exception, is_batch=False, batch_id=None):
    """동기화 중 발생한 예외를 처리합니다.
    
    Args:
        device_id: 장비 ID
        sync_type: 동기화 유형
        exception: 발생한 예외
        is_batch: 배치 동기화 여부
        batch_id: 배치 동기화 ID
        
    Returns:
        tuple: (False, error_message)
    """
    db.session.rollback()
    
    # 오류 이력 저장
    create_sync_history(
        device_id=device_id,
        sync_type=sync_type,
        status='failed',
        message=str(exception),
        is_batch=is_batch,
        batch_id=batch_id
    )
    db.session.commit()
    
    return False, f'동기화 중 오류 발생: {str(exception)}' 