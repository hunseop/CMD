from flask import Blueprint

objects_bp = Blueprint('objects', __name__, url_prefix='/objects')

from . import views, api 