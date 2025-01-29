from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@main_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/devices')
def devices():
    return render_template('devices.html')

@main_bp.route('/policies')
def policies():
    return render_template('policies.html')

@main_bp.route('/analysis')
def analysis():
    return render_template('analysis.html')

@main_bp.route('/scenarios')
def scenarios():
    return render_template('scenarios.html') 