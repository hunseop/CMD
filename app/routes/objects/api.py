import json
from flask import request, jsonify, send_file
from sqlalchemy import or_
from app import db
from app.models.firewall import FirewallNetworkObject, FirewallNetworkGroup, FirewallServiceObject, FirewallServiceGroup
from app.models.device import Device
from app.routes.objects import objects_bp
from app.utils.pagination import get_pagination_info
from app.utils.excel import generate_excel_file, get_excel_filename
from datetime import datetime
import io

@objects_bp.route('/api/list')
def get_objects():
    """객체 목록 API"""
    # 요청 파라미터
    object_type = request.args.get('type', 'network')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    filters_json = request.args.get('filters', '[]')
    
    try:
        filters = json.loads(filters_json)
    except:
        filters = []
    
    # 객체 유형에 따른 모델 선택
    if object_type == 'network':
        model = FirewallNetworkObject
    elif object_type == 'network-group':
        model = FirewallNetworkGroup
    elif object_type == 'service':
        model = FirewallServiceObject
    elif object_type == 'service-group':
        model = FirewallServiceGroup
    else:
        return jsonify({'error': '유효하지 않은 객체 유형입니다.'}), 400
    
    # 기본 쿼리
    query = model.query.join(model.device)
    
    # 검색어 적용
    if search:
        if object_type in ['network', 'service']:
            query = query.filter(or_(
                model.name.ilike(f'%{search}%'),
                model.device.has(name=search)
            ))
        else:  # network-group, service-group
            query = query.filter(or_(
                model.group_name.ilike(f'%{search}%'),
                model.device.has(name=search)
            ))
    
    # 필터 적용
    for filter_item in filters:
        field = filter_item.get('field')
        operator = filter_item.get('operator')
        value = filter_item.get('value')
        
        if not all([field, operator, value]):
            continue
        
        # 필드에 따른 필터링
        if field == 'device_name':
            # 장비명 필터링 로직 수정 - 연산자에 따라 다른 필터링 적용
            if operator == 'contains':
                query = query.filter(model.device.has(Device.name.ilike(f'%{value}%')))
            elif operator == 'not_contains':
                query = query.filter(~model.device.has(Device.name.ilike(f'%{value}%')))
            elif operator == 'equals':
                query = query.filter(model.device.has(Device.name == value))
            elif operator == 'not_equals':
                query = query.filter(~model.device.has(Device.name == value))
            elif operator == 'starts_with':
                query = query.filter(model.device.has(Device.name.ilike(f'{value}%')))
            elif operator == 'ends_with':
                query = query.filter(model.device.has(Device.name.ilike(f'%{value}')))
        elif field == 'name':
            if object_type in ['network', 'service']:
                if operator == 'contains':
                    query = query.filter(model.name.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.name.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.name == value)
                elif operator == 'not_equals':
                    query = query.filter(model.name != value)
                elif operator == 'starts_with':
                    query = query.filter(model.name.ilike(f'{value}%'))
                elif operator == 'ends_with':
                    query = query.filter(model.name.ilike(f'%{value}'))
            else:  # network-group, service-group
                if operator == 'contains':
                    query = query.filter(model.group_name.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.group_name.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.group_name == value)
                elif operator == 'not_equals':
                    query = query.filter(model.group_name != value)
                elif operator == 'starts_with':
                    query = query.filter(model.group_name.ilike(f'{value}%'))
                elif operator == 'ends_with':
                    query = query.filter(model.group_name.ilike(f'%{value}'))
        elif field == 'type' and object_type == 'network':
            if operator == 'contains':
                query = query.filter(model.type.ilike(f'%{value}%'))
            elif operator == 'not_contains':
                query = query.filter(~model.type.ilike(f'%{value}%'))
            elif operator == 'equals':
                query = query.filter(model.type == value)
            elif operator == 'not_equals':
                query = query.filter(model.type != value)
        elif field == 'value':
            if object_type in ['network']:
                if operator == 'contains':
                    query = query.filter(model.value.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.value.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.value == value)
                elif operator == 'not_equals':
                    query = query.filter(model.value != value)
            elif object_type in ['network-group', 'service-group']:
                if operator == 'contains':
                    query = query.filter(model.entry.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.entry.ilike(f'%{value}%'))
        elif field == 'firewall_type':
            if operator == 'contains':
                query = query.filter(model.firewall_type.ilike(f'%{value}%'))
            elif operator == 'not_contains':
                query = query.filter(~model.firewall_type.ilike(f'%{value}%'))
            elif operator == 'equals':
                query = query.filter(model.firewall_type == value)
            elif operator == 'not_equals':
                query = query.filter(model.firewall_type != value)
    
    # 페이지네이션
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    objects = pagination.items
    
    # 결과 변환
    result = []
    for obj in objects:
        item = {
            'id': obj.id,
            'device_id': obj.device_id,
            'device_name': obj.device.name,
            'firewall_type': obj.firewall_type,
            'last_sync_at': obj.last_sync_at.isoformat() if obj.last_sync_at else None
        }
        
        if object_type == 'network':
            item.update({
                'name': obj.name,
                'type': obj.type,
                'value': obj.value
            })
        elif object_type == 'network-group':
            item.update({
                'group_name': obj.group_name,
                'entry': obj.entry
            })
        elif object_type == 'service':
            item.update({
                'name': obj.name,
                'protocol': obj.protocol,
                'port': obj.port
            })
        elif object_type == 'service-group':
            item.update({
                'group_name': obj.group_name,
                'entry': obj.entry
            })
        
        result.append(item)
    
    # 페이지네이션 정보
    pagination_info = get_pagination_info(pagination)
    
    return jsonify({
        'objects': result,
        'object_type': object_type,
        'pagination': pagination_info
    })

@objects_bp.route('/api/export')
def export_objects():
    """객체 Excel 내보내기 API"""
    # 요청 파라미터
    object_type = request.args.get('type', 'network')
    search = request.args.get('search', '')
    filters_json = request.args.get('filters', '[]')
    
    try:
        filters = json.loads(filters_json)
    except:
        filters = []
    
    # 객체 유형에 따른 모델 선택
    if object_type == 'network':
        model = FirewallNetworkObject
        headers = ['장비명', '객체명', '객체 유형', '값', '방화벽 유형', '마지막 동기화']
    elif object_type == 'network-group':
        model = FirewallNetworkGroup
        headers = ['장비명', '그룹명', '멤버', '방화벽 유형', '마지막 동기화']
    elif object_type == 'service':
        model = FirewallServiceObject
        headers = ['장비명', '객체명', '프로토콜', '포트', '방화벽 유형', '마지막 동기화']
    elif object_type == 'service-group':
        model = FirewallServiceGroup
        headers = ['장비명', '그룹명', '멤버', '방화벽 유형', '마지막 동기화']
    else:
        return jsonify({'error': '유효하지 않은 객체 유형입니다.'}), 400
    
    # 기본 쿼리
    query = model.query.join(model.device)
    
    # 검색어 적용
    if search:
        if object_type in ['network', 'service']:
            query = query.filter(or_(
                model.name.ilike(f'%{search}%'),
                model.device.has(name=search)
            ))
        else:  # network-group, service-group
            query = query.filter(or_(
                model.group_name.ilike(f'%{search}%'),
                model.device.has(name=search)
            ))
    
    # 필터 적용 (get_objects와 동일한 로직)
    for filter_item in filters:
        field = filter_item.get('field')
        operator = filter_item.get('operator')
        value = filter_item.get('value')
        
        if not all([field, operator, value]):
            continue
        
        # 필드에 따른 필터링
        if field == 'device_name':
            # 장비명 필터링 로직 수정 - 연산자에 따라 다른 필터링 적용
            if operator == 'contains':
                query = query.filter(model.device.has(Device.name.ilike(f'%{value}%')))
            elif operator == 'not_contains':
                query = query.filter(~model.device.has(Device.name.ilike(f'%{value}%')))
            elif operator == 'equals':
                query = query.filter(model.device.has(Device.name == value))
            elif operator == 'not_equals':
                query = query.filter(~model.device.has(Device.name == value))
            elif operator == 'starts_with':
                query = query.filter(model.device.has(Device.name.ilike(f'{value}%')))
            elif operator == 'ends_with':
                query = query.filter(model.device.has(Device.name.ilike(f'%{value}')))
        elif field == 'name':
            if object_type in ['network', 'service']:
                if operator == 'contains':
                    query = query.filter(model.name.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.name.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.name == value)
                elif operator == 'not_equals':
                    query = query.filter(model.name != value)
                elif operator == 'starts_with':
                    query = query.filter(model.name.ilike(f'{value}%'))
                elif operator == 'ends_with':
                    query = query.filter(model.name.ilike(f'%{value}'))
            else:  # network-group, service-group
                if operator == 'contains':
                    query = query.filter(model.group_name.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.group_name.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.group_name == value)
                elif operator == 'not_equals':
                    query = query.filter(model.group_name != value)
                elif operator == 'starts_with':
                    query = query.filter(model.group_name.ilike(f'{value}%'))
                elif operator == 'ends_with':
                    query = query.filter(model.group_name.ilike(f'%{value}'))
        elif field == 'type' and object_type == 'network':
            if operator == 'contains':
                query = query.filter(model.type.ilike(f'%{value}%'))
            elif operator == 'not_contains':
                query = query.filter(~model.type.ilike(f'%{value}%'))
            elif operator == 'equals':
                query = query.filter(model.type == value)
            elif operator == 'not_equals':
                query = query.filter(model.type != value)
        elif field == 'value':
            if object_type in ['network']:
                if operator == 'contains':
                    query = query.filter(model.value.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.value.ilike(f'%{value}%'))
                elif operator == 'equals':
                    query = query.filter(model.value == value)
                elif operator == 'not_equals':
                    query = query.filter(model.value != value)
            elif object_type in ['network-group', 'service-group']:
                if operator == 'contains':
                    query = query.filter(model.entry.ilike(f'%{value}%'))
                elif operator == 'not_contains':
                    query = query.filter(~model.entry.ilike(f'%{value}%'))
        elif field == 'firewall_type':
            if operator == 'contains':
                query = query.filter(model.firewall_type.ilike(f'%{value}%'))
            elif operator == 'not_contains':
                query = query.filter(~model.firewall_type.ilike(f'%{value}%'))
            elif operator == 'equals':
                query = query.filter(model.firewall_type == value)
            elif operator == 'not_equals':
                query = query.filter(model.firewall_type != value)
    
    # 모든 객체 가져오기
    objects = query.all()
    
    # 데이터 준비
    data = []
    for obj in objects:
        if object_type == 'network':
            row = [
                obj.device.name,
                obj.name,
                obj.type,
                obj.value,
                obj.firewall_type,
                obj.last_sync_at.strftime('%Y-%m-%d %H:%M:%S') if obj.last_sync_at else ''
            ]
        elif object_type == 'network-group':
            row = [
                obj.device.name,
                obj.group_name,
                obj.entry,
                obj.firewall_type,
                obj.last_sync_at.strftime('%Y-%m-%d %H:%M:%S') if obj.last_sync_at else ''
            ]
        elif object_type == 'service':
            row = [
                obj.device.name,
                obj.name,
                obj.protocol,
                obj.port,
                obj.firewall_type,
                obj.last_sync_at.strftime('%Y-%m-%d %H:%M:%S') if obj.last_sync_at else ''
            ]
        elif object_type == 'service-group':
            row = [
                obj.device.name,
                obj.group_name,
                obj.entry,
                obj.firewall_type,
                obj.last_sync_at.strftime('%Y-%m-%d %H:%M:%S') if obj.last_sync_at else ''
            ]
        data.append(row)
    
    # 객체 유형에 따른 파일명
    object_type_names = {
        'network': '네트워크_객체',
        'network-group': '네트워크_그룹',
        'service': '서비스_객체',
        'service-group': '서비스_그룹'
    }
    
    # 유틸리티 함수를 사용하여 파일명 생성
    filename = get_excel_filename(object_type_names.get(object_type, '방화벽_객체'))
    
    # 유틸리티 함수를 사용하여 Excel 파일 생성
    excel_file = generate_excel_file(headers, data, f"방화벽 {object_type_names.get(object_type, '객체')}")
    
    # 파일 전송
    return send_file(
        excel_file,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) 