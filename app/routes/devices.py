from flask import Blueprint, render_template, request, redirect, url_for, flash
from app import db
from app.models import Device

devices_bp = Blueprint('devices', __name__, url_prefix='/devices')

@devices_bp.route('/')
def index():
    """장비 목록 조회"""
    devices = Device.query.all()
    return render_template('devices/index.html', devices=devices)

@devices_bp.route('/create', methods=['GET', 'POST'])
def create():
    """장비 등록"""
    if request.method == 'POST':
        try:
            device = Device(
                name=request.form['name'],
                category=request.form['category'],
                manufacturer=request.form['manufacturer'],
                model=request.form['model'],
                version=request.form['version'],
                ip_address=request.form['ip_address'],
                port=int(request.form['port']),
                username=request.form['username'],
                password=request.form['password']
            )
            db.session.add(device)
            db.session.commit()
            flash('장비가 성공적으로 등록되었습니다.', 'success')
            return redirect(url_for('devices.index'))
        except Exception as e:
            flash('장비 등록 중 오류가 발생했습니다.', 'error')
            db.session.rollback()
    return render_template('devices/create.html')

@devices_bp.route('/<int:id>/edit', methods=['GET', 'POST'])
def edit(id):
    """장비 정보 수정"""
    device = Device.query.get_or_404(id)
    if request.method == 'POST':
        try:
            device.name = request.form['name']
            device.category = request.form['category']
            device.manufacturer = request.form['manufacturer']
            device.model = request.form['model']
            device.version = request.form['version']
            device.ip_address = request.form['ip_address']
            device.port = int(request.form['port'])
            device.username = request.form['username']
            if request.form['password']:  # 비밀번호는 입력시에만 업데이트
                device.password = request.form['password']
            db.session.commit()
            flash('장비 정보가 수정되었습니다.', 'success')
            return redirect(url_for('devices.index'))
        except Exception as e:
            flash('장비 정보 수정 중 오류가 발생했습니다.', 'error')
            db.session.rollback()
    return render_template('devices/edit.html', device=device)

@devices_bp.route('/<int:id>/delete', methods=['POST'])
def delete(id):
    """장비 삭제"""
    device = Device.query.get_or_404(id)
    try:
        db.session.delete(device)
        db.session.commit()
        flash('장비가 삭제되었습니다.', 'success')
    except Exception as e:
        flash('장비 삭제 중 오류가 발생했습니다.', 'error')
        db.session.rollback()
    return redirect(url_for('devices.index')) 