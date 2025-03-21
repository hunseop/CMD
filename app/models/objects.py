from datetime import datetime
from app.extensions import db

class Object(db.Model):
    __tablename__ = 'objects'
    
    id = db.Column(db.Integer, primary_key=True)
    device_name = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # network, network-group, service, service-group
    value = db.Column(db.Text, nullable=False)
    firewall_type = db.Column(db.String(50), nullable=False)
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Object {self.name}>' 