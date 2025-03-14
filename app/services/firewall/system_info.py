from app import db
from app.models import FirewallSystemInfo
from app.services.firewall.common import get_device_and_collector, create_sync_history, handle_sync_exception

def sync_system_info(device_id):
    """방화벽 시스템 정보를 동기화합니다.
    
    Args:
        device_id: 장비 ID
        
    Returns:
        tuple: (success, message)
    """
    # 장비 및 수집기 가져오기
    device, collector, error = get_device_and_collector(device_id)
    if error:
        return False, error
    
    try:
        # 시스템 정보 가져오기
        system_info_df = collector.get_system_info()
        
        if system_info_df.empty:
            return False, "시스템 정보를 가져올 수 없습니다."
        
        # 기존 시스템 정보 조회 또는 새로 생성
        system_info = FirewallSystemInfo.query.filter_by(device_id=device.id).first()
        if not system_info:
            system_info = FirewallSystemInfo(device_id=device.id)
        
        # 시스템 정보 업데이트
        row = system_info_df.iloc[0]
        for column in system_info_df.columns:
            field_name = column.lower().replace('-', '_').replace(' ', '_')
            if hasattr(system_info, field_name):
                setattr(system_info, field_name, row.get(column))
        
        db.session.add(system_info)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='system_info',
            status='success',
            message='시스템 정보를 동기화했습니다.'
        )
        db.session.commit()
        
        return True, '시스템 정보를 동기화했습니다.'
    
    except Exception as e:
        return handle_sync_exception(device.id, 'system_info', e) 