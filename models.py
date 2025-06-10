from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)
    source = db.Column(db.String(50))  # 'upload', 'youtube', 'drive'
    source_url = db.Column(db.String(500))
    file_path = db.Column(db.String(500))
    transcript = db.Column(db.Text)
    analysis = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
