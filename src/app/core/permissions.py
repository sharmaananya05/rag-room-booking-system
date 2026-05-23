from app.models.enums import UserRole
from app.core.exceptions import ForbiddenException
from app.models.user import User

def require_roles(*roles: UserRole):
    def check(current_user: User) -> User:
        if current_user.role not in roles:
            raise ForbiddenException(f"Requires one of: {[r.value for r in roles]}")
        return current_user
    return check