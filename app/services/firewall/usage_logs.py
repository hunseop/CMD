from app import db
from app.models import FirewallPolicy
from app.services.firewall.common import get_device_and_collector, create_sync_history, handle_sync_exception
from datetime import datetime

def parse_date(date_str):
    """다양한 형식의 날짜 문자열을 파싱합니다.
    
    Args:
        date_str: 날짜 문자열
        
    Returns:
        datetime 객체 또는 None
    """
    if not date_str:
        return None
        
    formats = [
        '%Y-%m-%d %H:%M:%S',  # YYYY-MM-DD HH:MM:SS
        '%Y-%m-%d',           # YYYY-MM-DD
    ]
    
    for date_format in formats:
        try:
            return datetime.strptime(date_str.strip(), date_format)
        except ValueError:
            continue
    
    return None

def sync_usage_logs(device_id, days=90, is_batch=False, batch_id=None):
    """방화벽 정책 사용 이력을 동기화합니다.
    
    Args:
        device_id: 장비 ID
        days: 조회할 기간(일), 기본값 90일
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
        # 정책 사용 이력 가져오기
        usage_logs_df = collector.export_usage_logs(days=days)
        
        # 정책 사용 이력 업데이트
        for _, row in usage_logs_df.iterrows():
            rule_name = row.get('Rule Name', '')
            last_hit_date = row.get('Last Hit Date', '')
            unused_days = row.get('Unused Days', 0)
            usage_status = row.get('미사용여부', '')
            
            # 해당 정책 찾기
            policy = FirewallPolicy.query.filter_by(
                device_id=device.id,
                rule_name=rule_name
            ).first()
            
            if policy:
                # 사용 이력 업데이트
                policy.last_hit = parse_date(last_hit_date)
                policy.unused_days = unused_days
                policy.usage_status = usage_status
                db.session.add(policy)
        
        # 동기화 이력 저장
        create_sync_history(
            device_id=device.id,
            sync_type='usage_logs',
            status='success',
            message=f'{len(usage_logs_df)} 개의 정책 사용 이력을 동기화했습니다.',
            is_batch=is_batch,
            batch_id=batch_id
        )
        db.session.commit()
        
        return True, f'{len(usage_logs_df)} 개의 정책 사용 이력을 동기화했습니다.'
    
    except Exception as e:
        # 예외 처리 시에도 배치 정보 전달
        if is_batch and batch_id:
            return handle_sync_exception(device.id, 'usage_logs', e, is_batch, batch_id)
        else:
            return handle_sync_exception(device.id, 'usage_logs', e) 