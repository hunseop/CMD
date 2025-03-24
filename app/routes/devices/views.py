from flask import render_template, request, jsonify
from app import db
from app.models import Device, FirewallSystemInfo, SyncHistory, SyncTask
from app.routes.devices import devices_bp

@devices_bp.route('/')
def index():
    """장비 목록 조회"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    per_page = 10  # 페이지당 항목 수
    
    # 검색 쿼리 구성
    query = Device.query
    if search:
        query = query.filter(
            Device.name.ilike(f'%{search}%') |
            Device.category.ilike(f'%{search}%') |
            Device.manufacturer.ilike(f'%{search}%') |
            Device.model.ilike(f'%{search}%') |
            Device.ip_address.ilike(f'%{search}%')
        )
    
    # 페이지네이션 적용
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    devices = pagination.items
    
    # 각 장비별 마지막 동기화 정보 조회
    sync_info = {}
    for device in devices:
        if device.category == 'firewall':
            # 시스템 정보 동기화 여부
            system_info = FirewallSystemInfo.query.filter_by(device_id=device.id).first()
            
            # 마지막 동기화 이력
            last_sync = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).first()
            
            sync_info[device.id] = {
                'system_info': system_info,
                'last_sync': last_sync
            }
    
    # AJAX 요청인 경우 JSON 응답
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_template('devices/_table.html',
                             devices=devices,
                             sync_info=sync_info)
        pagination_html = render_template('devices/_pagination.html',
                                        pagination=pagination)
        return jsonify({
            'html': html,
            'pagination': pagination_html
        })
    
    # 일반 요청인 경우 전체 페이지 렌더링
    return render_template('devices/index.html',
                         devices=devices,
                         sync_info=sync_info,
                         pagination=pagination)

@devices_bp.route('/list')
def list_devices():
    """장비 목록 AJAX 조회"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    per_page = 10
    
    # 검색 쿼리 구성
    query = Device.query
    if search:
        query = query.filter(
            Device.name.ilike(f'%{search}%') |
            Device.category.ilike(f'%{search}%') |
            Device.manufacturer.ilike(f'%{search}%') |
            Device.model.ilike(f'%{search}%') |
            Device.ip_address.ilike(f'%{search}%')
        )
    
    # 페이지네이션 적용
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    devices = pagination.items
    
    # 각 장비별 정보 조회
    sync_info = {}
    for device in devices:
        if device.category == 'firewall':
            # 시스템 정보 동기화 여부
            system_info = FirewallSystemInfo.query.filter_by(device_id=device.id).first()
            
            # 마지막 동기화 이력
            last_sync = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).first()
            
            # 현재 실행/대기 중인 작업
            active_task = SyncTask.query.filter(
                SyncTask.device_id == device.id,
                SyncTask.status.in_(['pending', 'running'])
            ).order_by(SyncTask.created_at.desc()).first()
            
            # 최근 완료된 작업
            last_task = None
            if not active_task:
                last_task = SyncTask.query.filter(
                    SyncTask.device_id == device.id,
                    SyncTask.status.in_(['completed', 'failed', 'canceled'])
                ).order_by(SyncTask.completed_at.desc()).first()
            
            sync_info[device.id] = {
                'system_info': system_info,
                'last_sync': last_sync,
                'active_task': active_task,
                'last_task': last_task
            }
    
    # 테이블 내용과 페이지네이션 HTML 렌더링
    table_html = render_template('devices/_table.html',
                               devices=devices,
                               sync_info=sync_info)
    pagination_html = render_template('devices/_pagination.html',
                                    pagination=pagination)
    
    return jsonify({
        'html': table_html,
        'pagination': pagination_html
    })

@devices_bp.route('/<int:id>/detail')
def detail(id):
    """장비 상세 정보 조회"""
    device = Device.query.get_or_404(id)
    
    # 방화벽 정보 조회
    system_info = None
    sync_histories = []
    current_tasks = []
    recent_tasks = []
    
    if device.category == 'firewall':
        system_info = device.system_info
        
        # 동기화 이력 조회
        sync_histories = SyncHistory.query.filter_by(device_id=device.id).order_by(SyncHistory.created_at.desc()).limit(5).all()
        
        # 현재 진행 중인 작업 조회
        current_tasks = SyncTask.query.filter(
            SyncTask.device_id == device.id,
            SyncTask.status.in_(['pending', 'running'])
        ).order_by(SyncTask.created_at.desc()).all()
        
        # 최근 완료된 작업 조회
        recent_tasks = SyncTask.query.filter(
            SyncTask.device_id == device.id,
            SyncTask.status.in_(['completed', 'failed', 'canceled'])
        ).order_by(SyncTask.created_at.desc()).limit(5).all()
    
    return render_template('devices/detail.html', 
                          device=device,
                          system_info=system_info,
                          sync_histories=sync_histories,
                          current_tasks=current_tasks,
                          recent_tasks=recent_tasks) 