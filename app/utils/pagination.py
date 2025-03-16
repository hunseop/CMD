"""
페이지네이션 유틸리티 모듈
"""

def get_pagination_info(pagination):
    """
    SQLAlchemy 페이지네이션 객체에서 필요한 정보를 추출하여 반환합니다.
    
    Args:
        pagination: SQLAlchemy 페이지네이션 객체
        
    Returns:
        dict: 페이지네이션 정보를 담은 딕셔너리
    """
    # 페이지 번호 목록 생성
    pages = []
    for page in pagination.iter_pages(left_edge=1, right_edge=1, left_current=2, right_current=2):
        if page:
            pages.append(page)
        else:
            # 생략된 페이지는 '...'로 표시
            if len(pages) > 0 and pages[-1] != '...':
                pages.append('...')
    
    return {
        'page': pagination.page,
        'pages': pages,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'has_prev': pagination.has_prev,
        'has_next': pagination.has_next,
        'prev_num': pagination.prev_num,
        'next_num': pagination.next_num
    } 