from app import db
from app.models import FirewallServiceObject, FirewallServiceGroup
from app.services.firewall.common import get_device_and_collector, create_sync_history, handle_sync_exception

def sync_service_objects(device_id):
    """방화벽 서비스 객체를 동기화합니다.
    
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
        # 서비스 객체 가져오기
        objects_df = collector.export_service_objects()
        
        # 기존 객체 삭제
        FirewallServiceObject.query.filter_by(device_id=device.id).delete()
        
        # 새 객체 저장
        for _, row in objects_df.iterrows():
            obj = FirewallServiceObject(
                device_id=device.id,
                firewall_type=device.sub_category,
                name=row.get('Name', ''),
                protocol=row.get('Protocol', ''),
                port=row.get('Port', '')
            )
            db.session.add(obj)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='service_objects',
            status='success',
            message=f'{len(objects_df)} 개의 서비스 객체를 동기화했습니다.'
        )
        db.session.commit()
        
        return True, f'{len(objects_df)} 개의 서비스 객체를 동기화했습니다.'
    
    except Exception as e:
        return handle_sync_exception(device.id, 'service_objects', e)

def sync_service_groups(device_id):
    """방화벽 서비스 그룹 객체를 동기화합니다.
    
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
        # 서비스 그룹 가져오기
        groups_df = collector.export_service_group_objects()
        
        # 기존 그룹 삭제
        FirewallServiceGroup.query.filter_by(device_id=device.id).delete()
        
        # 새 그룹 저장
        for _, row in groups_df.iterrows():
            group = FirewallServiceGroup(
                device_id=device.id,
                firewall_type=device.sub_category,
                group_name=row.get('Name', ''),
                entry=row.get('Members', '')
            )
            db.session.add(group)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='service_groups',
            status='success',
            message=f'{len(groups_df)} 개의 서비스 그룹을 동기화했습니다.'
        )
        db.session.commit()
        
        return True, f'{len(groups_df)} 개의 서비스 그룹을 동기화했습니다.'
    
    except Exception as e:
        return handle_sync_exception(device.id, 'service_groups', e) 