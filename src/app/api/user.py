from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active users — dean / admin_assistant only."""
    require_roles(UserRole.dean, UserRole.admin_assistant)(current_user)
    return await UserRepository(db).list_active()


@router.get("/by-role/{role}", response_model=list[UserResponse])
async def list_by_role(
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Useful for populating dropdowns (e.g. pick faculty incharge)."""
    require_roles(UserRole.faculty, UserRole.hod, UserRole.admin_assistant, UserRole.dean)(current_user)
    return await UserRepository(db).list_by_role(role)