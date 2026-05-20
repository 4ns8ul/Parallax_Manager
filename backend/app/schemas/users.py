from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# Permission Schemas
class PermissionBase(BaseModel):
    name: str
    resource: str
    action: str

class PermissionOut(PermissionBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleOut(RoleBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    status: Optional[str] = "ACTIVE"

class UserCreate(UserBase):
    password: str
    role_names: Optional[List[str]] = ["EMPLOYEE"]

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    role_names: Optional[List[str]] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    roles: List[RoleOut] = []

    model_config = ConfigDict(from_attributes=True)

class UserSummary(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)
