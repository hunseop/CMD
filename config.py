import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-12345'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///cmd.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 업로드 설정
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 최대 16MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads') 