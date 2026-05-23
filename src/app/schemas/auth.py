from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    phone: str | None = None
    role: UserRole
    department_id: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str