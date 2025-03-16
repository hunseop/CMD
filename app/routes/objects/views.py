from flask import render_template, request, jsonify
from app.models.firewall import FirewallNetworkObject, FirewallNetworkGroup, FirewallServiceObject, FirewallServiceGroup
from app.routes.objects import objects_bp
from app import db
from sqlalchemy import or_

@objects_bp.route('/')
def index():
    """방화벽 객체 관리 페이지"""
    # 기본적으로 네트워크 객체 유형으로 설정
    object_type = request.args.get('object_type', 'network')
    
    # 페이지네이션을 위한 빈 객체 생성 (초기 로드 시 사용)
    class EmptyPagination:
        def __init__(self):
            self.page = 1
            self.per_page = 10
            self.total = 0
            self.pages = 0
            self.has_prev = False
            self.has_next = False
            self.prev_num = 0
            self.next_num = 0
        
        def iter_pages(self, left_edge=1, right_edge=1, left_current=2, right_current=2):
            return []
    
    # 빈 페이지네이션 객체 생성
    pagination = EmptyPagination()
    
    # 빈 객체 목록 생성
    objects = []
    
    return render_template('objects/index.html', objects=objects, pagination=pagination, object_type=object_type)

@objects_bp.route('/network')
def network_objects():
    """네트워크 객체 목록 페이지"""
    return render_template('objects/index.html', object_type='network', objects=[], pagination=EmptyPagination())

@objects_bp.route('/network-group')
def network_groups():
    """네트워크 그룹 목록 페이지"""
    return render_template('objects/index.html', object_type='network-group', objects=[], pagination=EmptyPagination())

@objects_bp.route('/service')
def service_objects():
    """서비스 객체 목록 페이지"""
    return render_template('objects/index.html', object_type='service', objects=[], pagination=EmptyPagination())

@objects_bp.route('/service-group')
def service_groups():
    """서비스 그룹 목록 페이지"""
    return render_template('objects/index.html', object_type='service-group', objects=[], pagination=EmptyPagination())

# EmptyPagination 클래스 정의
class EmptyPagination:
    def __init__(self):
        self.page = 1
        self.per_page = 10
        self.total = 0
        self.pages = 0
        self.has_prev = False
        self.has_next = False
        self.prev_num = 0
        self.next_num = 0
    
    def iter_pages(self, left_edge=1, right_edge=1, left_current=2, right_current=2):
        return [] 