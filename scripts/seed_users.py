import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from sqlalchemy import text
from app.db.session import AsyncSessionFactory
from app.models.user import User
from app.models.enums import UserRole

HASHED_PASSWORD = "$2b$12$KWu7myFIi4JsgUsi0NBs3OrfYNLHOd0AB2yvBK62mZn01AiG01RS."

USERS = [
    {
        "id":              "seed-user-faculty",
        "email":           "231030070@juitsolan.in",
        "name":            "Faculty User",
        "role":            UserRole.faculty,
        "hashed_password": HASHED_PASSWORD,
    },
    {
        "id":              "seed-user-admin",
        "email":           "231030145@juitsolan.in",
        "name":            "Admin Assistant",
        "role":            UserRole.admin_assistant,
        "hashed_password": HASHED_PASSWORD,
    },
    {
        "id":              "seed-user-hod",
        "email":           "231030113@juitsolan.in",
        "name":            "HOD User",
        "role":            UserRole.hod,
        "hashed_password": HASHED_PASSWORD,
    },
    {
        "id":              "seed-user-dean",
        "email":           "231033027@juitsolan.in",
        "name":            "Dean User",
        "role":            UserRole.dean,
        "hashed_password": HASHED_PASSWORD,
    },
]


async def seed() -> None:
    async with AsyncSessionFactory() as session:
        for u in USERS:
            # Skip if email already exists
            result = await session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": u["email"]},
            )
            if result.scalar_one_or_none():
                print(f"[SKIP] {u['email']} already exists")
                continue

            session.add(User(**u))
            print(f"[ADD]  {u['email']} as {u['role'].value}")

        await session.commit()
        print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed())