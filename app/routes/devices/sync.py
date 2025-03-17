from flask import request, jsonify, flash, redirect, url_for
from app.models import Device, SyncHistory
from app.routes.devices import devices_bp
from app.services.firewall import (
    sync_system_info,
    sync_firewall_policies,
    sync_network_objects,
    sync_network_groups,
    sync_service_objects,
    sync_service_groups,
    sync_usage_logs,
    sync_all
)
from app import db
from app.services.firewall.common import generate_batch_id

@devices_bp.route('/<int:id>/sync', methods=['POST'])
def sync_device(id):
    """장비 정보 동기화"""
    device = Device.query.get_or_404(id)
    
    # 동기화 유형 (여러 항목 선택 가능)
    sync_types = request.form.getlist('sync_type')
    
    # 결과 저장
    results = {}
    all_success = True
    
    # 모든 항목 동기화 요청인 경우
    if 'all' in sync_types:
        success, message = sync_all(device.id)
        
        # 배치 동기화 결과를 가져옴 (가장 최근 배치 ID 기준)
        if success:
            # 가장 최근 배치 ID 조회
            latest_batch = SyncHistory.query.filter_by(
                device_id=device.id,
                is_batch=True
            ).order_by(SyncHistory.created_at.desc()).first()
            
            if latest_batch:
                batch_id = latest_batch.batch_id
                # 배치 동기화 결과 조회
                batch_results = SyncHistory.query.filter_by(
                    device_id=device.id,
                    batch_id=batch_id
                ).all()
                
                # 결과 정리
                for result in batch_results:
                    results[result.sync_type] = {
                        'success': result.status == 'success',
                        'message': result.message
                    }
        else:
            # 실패한 경우 간단한 결과만 저장
            results['all'] = {'success': success, 'message': message}
        
        all_success = success
    else:
        # 여러 항목 동기화인 경우 배치 ID 생성
        batch_id = generate_batch_id() if len(sync_types) > 1 else None
        is_batch = len(sync_types) > 1
        
        # 선택된 항목만 동기화
        for sync_type in sync_types:
            if sync_type == 'system_info':
                success, message = sync_system_info(device.id, is_batch=is_batch, batch_id=batch_id)
                results['system_info'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'policies':
                success, message = sync_firewall_policies(device.id, is_batch=is_batch, batch_id=batch_id)
                results['policies'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'network_objects':
                success, message = sync_network_objects(device.id, is_batch=is_batch, batch_id=batch_id)
                results['network_objects'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'network_groups':
                success, message = sync_network_groups(device.id, is_batch=is_batch, batch_id=batch_id)
                results['network_groups'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'service_objects':
                success, message = sync_service_objects(device.id, is_batch=is_batch, batch_id=batch_id)
                results['service_objects'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'service_groups':
                success, message = sync_service_groups(device.id, is_batch=is_batch, batch_id=batch_id)
                results['service_groups'] = {'success': success, 'message': message}
                all_success = all_success and success
            
            elif sync_type == 'usage_logs':
                days = request.form.get('days', 90, type=int)
                success, message = sync_usage_logs(device.id, days=days, is_batch=is_batch, batch_id=batch_id)
                results['usage_logs'] = {'success': success, 'message': message}
                all_success = all_success and success
    
    # 결과 메시지 생성
    if not sync_types:
        message = "동기화할 항목을 선택해주세요."
        success = False
    elif all_success:
        message = "선택한 항목이 성공적으로 동기화되었습니다."
        success = True
    else:
        message = "일부 항목 동기화 중 오류가 발생했습니다."
        success = False
    
    # AJAX 요청인 경우 JSON 응답 반환
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
        return jsonify({
            'success': success,
            'message': message,
            'results': results
        })
    
    # 일반 요청인 경우 리다이렉트
    if success:
        flash(message, 'success')
    else:
        flash(message, 'error')
    
    return redirect(url_for('devices.index')) 