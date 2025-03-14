from flask import Blueprint, render_template, request, jsonify
from app.models import Device, FirewallPolicy
from app import db

policies_bp = Blueprint('policies', __name__, url_prefix='/policies')

@policies_bp.route('/')
def index():
    """정책 목록 조회"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)  # 페이지당 항목 수
    search = request.args.get('search', '')
    device_id = request.args.get('device_id', type=int)
    status = request.args.get('status', '')
    
    # 쿼리 구성
    query = FirewallPolicy.query.join(Device)
    
    # 검색 조건
    if search:
        query = query.filter(
            FirewallPolicy.rule_name.ilike(f'%{search}%') |
            FirewallPolicy.source.ilike(f'%{search}%') |
            FirewallPolicy.destination.ilike(f'%{search}%') |
            FirewallPolicy.service.ilike(f'%{search}%') |
            Device.name.ilike(f'%{search}%')
        )
    
    # 장비 필터
    if device_id:
        query = query.filter(FirewallPolicy.device_id == device_id)
    
    # 상태 필터
    if status:
        query = query.filter(FirewallPolicy.enable == status)
    
    # 정렬 (순서 및 장비별)
    query = query.order_by(Device.name, FirewallPolicy.seq)
    
    # 페이지네이션 적용
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    policies = pagination.items
    
    # 장비 목록 조회 (필터용)
    devices = Device.query.filter_by(category='firewall').all()
    
    # AJAX 요청인 경우 JSON 응답
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_template('policies/_table.html',
                             policies=policies,
                             pagination=pagination)
        pagination_html = render_template('policies/_pagination.html',
                                        pagination=pagination)
        return jsonify({
            'html': html,
            'pagination': pagination_html
        })
    
    # 일반 요청인 경우 전체 페이지 렌더링
    return render_template('policies/index.html',
                         policies=policies,
                         devices=devices,
                         pagination=pagination) 