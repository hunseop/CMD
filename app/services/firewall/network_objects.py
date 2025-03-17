from app import db
from app.models import FirewallNetworkObject, FirewallNetworkGroup
from app.services.firewall.common import get_device_and_collector, create_sync_history, handle_sync_exception

def sync_network_objects(device_id, is_batch=False, batch_id=None):
    """방화벽 네트워크 객체를 동기화합니다.
    
    Args:
        device_id: 장비 ID
        is_batch: 배치 동기화 여부
        batch_id: 배치 동기화 ID
        
    Returns:
        tuple: (success, message)
    """
    # 장비 및 수집기 가져오기
    device, collector, error = get_device_and_collector(device_id)
    if error:
        return False, error
    
    try:
        # 네트워크 객체 가져오기
        objects_df = collector.export_network_objects()
        
        # 기존 객체 삭제
        FirewallNetworkObject.query.filter_by(device_id=device.id).delete()
        
        # 새 객체 저장
        for _, row in objects_df.iterrows():
            obj = FirewallNetworkObject(
                device_id=device.id,
                firewall_type=device.sub_category,
                name=row.get('Name', ''),
                type=row.get('Type', ''),
                value=row.get('Value', '')
            )
            db.session.add(obj)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='network_objects',
            status='success',
            message=f'{len(objects_df)} 개의 네트워크 객체를 동기화했습니다.',
            is_batch=is_batch,
            batch_id=batch_id
        )
        db.session.commit()
        
        return True, f'{len(objects_df)} 개의 네트워크 객체를 동기화했습니다.'
    
    except Exception as e:
        # 예외 처리 시에도 배치 정보 전달
        if is_batch and batch_id:
            return handle_sync_exception(device.id, 'network_objects', e, is_batch, batch_id)
        else:
            return handle_sync_exception(device.id, 'network_objects', e)

def sync_network_groups(device_id, is_batch=False, batch_id=None):
    """방화벽 네트워크 그룹을 동기화합니다.
    
    Args:
        device_id: 장비 ID
        is_batch: 배치 동기화 여부
        batch_id: 배치 동기화 ID
        
    Returns:
        tuple: (success, message)
    """
    # 장비 및 수집기 가져오기
    device, collector, error = get_device_and_collector(device_id)
    if error:
        return False, error
    
    try:
        # 네트워크 그룹 가져오기
        groups_df = collector.export_network_group_objects()
        
        # 기존 그룹 삭제
        FirewallNetworkGroup.query.filter_by(device_id=device.id).delete()
        
        # 새 그룹 저장
        for _, row in groups_df.iterrows():
            group = FirewallNetworkGroup(
                device_id=device.id,
                firewall_type=device.sub_category,
                group_name=row.get('Name', ''),
                entry=row.get('Members', '')
            )
            db.session.add(group)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='network_groups',
            status='success',
            message=f'{len(groups_df)} 개의 네트워크 그룹을 동기화했습니다.',
            is_batch=is_batch,
            batch_id=batch_id
        )
        db.session.commit()
        
        return True, f'{len(groups_df)} 개의 네트워크 그룹을 동기화했습니다.'
    
    except Exception as e:
        # 예외 처리 시에도 배치 정보 전달
        if is_batch and batch_id:
            return handle_sync_exception(device.id, 'network_groups', e, is_batch, batch_id)
        else:
            return handle_sync_exception(device.id, 'network_groups', e) 