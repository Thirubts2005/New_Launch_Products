from sqlalchemy import Column, String, Integer, DateTime, Text, func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    tagline = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    votes = Column(Integer, default=0, nullable=False)
    launch_date = Column(DateTime, nullable=False, index=True)
    thumbnail = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Product(name={self.name}, category={self.category}, votes={self.votes})>"
