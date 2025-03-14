from flask import Blueprint, render_template, request, jsonify
from app.models import Device, FirewallPolicy
from app import db

policies_bp = Blueprint('policies', __name__, url_prefix='/policies')

@policies_bp.route('/', methods=['GET', 'POST'])
def index():
    """정책 목록 조회"""
    try:
        # POST 요청 처리 (AJAX)
        if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            data = request.get_json()
            page = int(data.get('page', 1))
            per_page = int(data.get('per_page', 10))
            filters = data.get('filters', [])
            search = data.get('search', '')
        else:
            # GET 요청 처리
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            filters = []
            search = request.args.get('search', '')

        # 기본 쿼리 구성
        query = FirewallPolicy.query.join(Device)
        
        # 필터 적용
        or_filters = []
        
        for filter in filters:
            field = filter['field']
            operator = filter['operator']
            value = filter['value']
            join = filter.get('join')

            # 필터 조건 생성
            condition = None
            if field == 'device_name':
                if operator == 'contains':
                    condition = Device.name.ilike(f'%{value}%')
                elif operator == 'not_contains':
                    condition = ~Device.name.ilike(f'%{value}%')
                elif operator == 'equals':
                    condition = Device.name == value
                elif operator == 'not_equals':
                    condition = Device.name != value
                elif operator == 'starts_with':
                    condition = Device.name.ilike(f'{value}%')
                elif operator == 'ends_with':
                    condition = Device.name.ilike(f'%{value}')
            elif field == 'action':
                if operator == 'equals':
                    condition = FirewallPolicy.action == value
                elif operator == 'not_equals':
                    condition = FirewallPolicy.action != value
            elif field == 'usage_status':
                # 사용 여부 필터링 (true=사용, false=미사용)
                usage_value = '사용' if value.lower() == 'true' else '미사용'
                if operator == 'equals':
                    condition = FirewallPolicy.usage_status == usage_value
                elif operator == 'not_equals':
                    condition = FirewallPolicy.usage_status != usage_value
            elif field == 'enable':
                # 활성화 여부 필터링 (true=1, false=0)
                enable_value = '1' if value.lower() == 'true' else '0'
                if operator == 'equals':
                    condition = FirewallPolicy.enable == enable_value
                elif operator == 'not_equals':
                    condition = FirewallPolicy.enable != enable_value
            else:
                column = getattr(FirewallPolicy, field, None)
                if column is not None:
                    if operator == 'contains':
                        condition = column.ilike(f'%{value}%')
                    elif operator == 'not_contains':
                        condition = ~column.ilike(f'%{value}%')
                    elif operator == 'equals':
                        condition = column == value
                    elif operator == 'not_equals':
                        condition = column != value
                    elif operator == 'starts_with':
                        condition = column.ilike(f'{value}%')
                    elif operator == 'ends_with':
                        condition = column.ilike(f'%{value}')

            # 조건 적용
            if condition is not None:
                if join == 'or':
                    or_filters.append(condition)
                else:
                    query = query.filter(condition)

        # OR 조건들 적용
        if or_filters:
            query = query.filter(db.or_(*or_filters))

        # 검색 조건 (필터된 결과 내 검색)
        if search:
            search_conditions = [
                FirewallPolicy.rule_name.ilike(f'%{search}%'),
                FirewallPolicy.source.ilike(f'%{search}%'),
                FirewallPolicy.destination.ilike(f'%{search}%'),
                FirewallPolicy.service.ilike(f'%{search}%'),
                Device.name.ilike(f'%{search}%')
            ]
            query = query.filter(db.or_(*search_conditions))
        
        # 정렬 (순서 및 장비별)
        query = query.order_by(Device.name, FirewallPolicy.seq)
        
        # 페이지네이션 적용
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        policies = pagination.items
        
        # AJAX 요청인 경우 JSON 응답
        if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
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
                            pagination=pagination)
                            
    except Exception as e:
        print(f"Error in index route: {str(e)}")  # 디버깅용 로그
        if request.method == 'POST':
            return jsonify({'error': '데이터를 불러오는 중 오류가 발생했습니다.'}), 500
        return render_template('error.html', error='데이터를 불러오는 중 오류가 발생했습니다.'), 500 