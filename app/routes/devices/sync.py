from flask import request, jsonify, flash, redirect, url_for
from app.models import Device, SyncHistory, SyncTask
from app.routes.devices import devices_bp
from app.services.firewall import (
    SyncQueueService,
    SYNC_TYPES
)
from app import db
from app.services.firewall.common import generate_batch_id
from flask import current_app as app

@devices_bp.route('/<int:id>/sync', methods=['POST'])
def sync_device(id):
    """장비 정보 동기화 (큐에 작업 추가)"""
    device = Device.query.get_or_404(id)
    
    # 동기화 유형 (여러 항목 선택 가능)
    sync_types = request.form.getlist('sync_type')
    
    # 동기화 유형이 없으면 에러
    if not sync_types:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return jsonify({
                'success': False,
                'message': "동기화할 항목을 선택해주세요."
            })
        flash("동기화할 항목을 선택해주세요.", 'error')
        return redirect(url_for('devices.index'))
    
    try:
        # 'all'이 선택된 경우 모든 항목 추가
        if 'all' in sync_types:
            sync_types = [
                SYNC_TYPES['SYSTEM_INFO'],
                SYNC_TYPES['POLICIES'],
                SYNC_TYPES['NETWORK_OBJECTS'],
                SYNC_TYPES['NETWORK_GROUPS'],
                SYNC_TYPES['SERVICE_OBJECTS'],
                SYNC_TYPES['SERVICE_GROUPS'],
                SYNC_TYPES['USAGE_LOGS']
            ]
        
        # 작업명 생성
        task_name = f"{device.name} 동기화"
        
        # 작업 생성
        success, result = SyncQueueService.create_task(
            device_id=id,
            sync_types=sync_types,
            task_name=task_name
        )
        
        # 결과 메시지 처리
        if success:
            message = "동기화 작업이 큐에 추가되었습니다. 상세 페이지에서 진행 상황을 확인할 수 있습니다."
            status = 'success'
        else:
            message = f"동기화 작업 추가 실패: {result}"
            status = 'error'
        
        # AJAX 요청인 경우 JSON 응답 반환
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
            response = {
                'success': success,
                'message': message
            }
            
            # 작업 정보 포함 (성공한 경우)
            if success and isinstance(result, SyncTask):
                response['task'] = {
                    'id': result.id,
                    'status': result.status,
                    'progress': result.progress,
                    'queue_position': result.queue_position
                }
                
            return jsonify(response)
        
        # 일반 요청인 경우 리다이렉트
        flash(message, status)
        return redirect(url_for('devices.index'))
        
    except Exception as e:
        app.logger.error(f"동기화 작업 생성 중 오류 발생: {str(e)}")
        
        # AJAX 요청인 경우 JSON 응답 반환
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return jsonify({
                'success': False,
                'message': f"오류 발생: {str(e)}"
            })
        
        # 일반 요청인 경우 리다이렉트
        flash(f"동기화 작업 생성 중 오류 발생: {str(e)}", 'error')
        return redirect(url_for('devices.index'))

@devices_bp.route('/api/tasks/<int:id>', methods=['GET'])
def get_task_status(id):
    """동기화 작업 상태 조회 API"""
    task = SyncTask.query.get_or_404(id)
    
    return jsonify({
        'id': task.id,
        'device_id': task.device_id,
        'task_name': task.task_name,
        'status': task.status,
        'progress': task.progress,
        'current_sync_type': task.current_sync_type,
        'message': task.message,
        'queue_position': task.queue_position,
        'elapsed_time': task.elapsed_time_formatted,
        'created_at': task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'started_at': task.started_at.strftime('%Y-%m-%d %H:%M:%S') if task.started_at else None,
        'completed_at': task.completed_at.strftime('%Y-%m-%d %H:%M:%S') if task.completed_at else None
    })

@devices_bp.route('/api/tasks/<int:id>/cancel', methods=['POST'])
def cancel_task(id):
    """동기화 작업 취소 API"""
    try:
        success, result = SyncQueueService.cancel_task(id)
        
        if success:
            return jsonify({
                'success': True,
                'message': "작업이 취소되었습니다."
            })
        else:
            return jsonify({
                'success': False,
                'message': result
            }), 400
            
    except Exception as e:
        app.logger.error(f"작업 취소 중 오류 발생: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"오류 발생: {str(e)}"
        }), 500

@devices_bp.route('/api/devices/<int:id>/tasks', methods=['GET'])
def get_device_tasks(id):
    """장비의 동기화 작업 목록 조회 API"""
    # 장비 존재 여부 확인
    device = Device.query.get_or_404(id)
    
    # 완료된 작업 포함 여부
    include_completed = request.args.get('include_completed', 'false').lower() == 'true'
    
    # 결과 개수 제한
    limit = request.args.get('limit', 10, type=int)
    
    # 작업 목록 조회
    tasks = SyncQueueService.get_device_tasks(id, limit, include_completed)
    
    result = []
    for task in tasks:
        result.append({
            'id': task.id,
            'task_name': task.task_name,
            'status': task.status,
            'progress': task.progress,
            'current_sync_type': task.current_sync_type,
            'message': task.message,
            'queue_position': task.queue_position,
            'elapsed_time': task.elapsed_time_formatted,
            'created_at': task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'started_at': task.started_at.strftime('%Y-%m-%d %H:%M:%S') if task.started_at else None,
            'completed_at': task.completed_at.strftime('%Y-%m-%d %H:%M:%S') if task.completed_at else None
        })
    
    return jsonify({
        'success': True,
        'device': {
            'id': device.id,
            'name': device.name
        },
        'tasks': result
    }) 