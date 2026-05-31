from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List

class ProductBase(BaseModel):
    name: str
    tagline: str
    description: Optional[str] = None
    votes: int = 0
    launch_date: datetime
    thumbnail: Optional[str] = None
    website_url: Optional[str] = None
    category: str

class ProductCreate(ProductBase):
    id: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    votes: Optional[int] = None
    thumbnail: Optional[str] = None
    website_url: Optional[str] = None
    category: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class VoteRequest(BaseModel):
    # Optional field if we want to identify the voter's local session
    voter_session: Optional[str] = None

class VoteResponse(BaseModel):
    product_id: str
    votes: int
    success: bool

class SyncResponse(BaseModel):
    success: bool
    message: str
    added_count: int
