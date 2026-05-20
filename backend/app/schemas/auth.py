from pydantic import BaseModel, EmailStr
from typing import Optional, List

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    email: str
    user_id: int

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []
