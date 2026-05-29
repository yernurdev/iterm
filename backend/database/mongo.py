from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

class DataBase:
    client: AsyncIOMotorClient = None

db = DataBase()

async def get_database():
    return db.client[settings.MONGODB_DB_NAME]

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = db.client[settings.MONGODB_DB_NAME]
    await database.terms.create_index([("ru", "text"), ("kz", "text"), ("en", "text")])
    await database.terms.create_index("category")
    await database.users.create_index("email", unique=True)
    await database.check_history.create_index([("user_email", 1), ("created_at", -1)])

async def close_mongo_connection():
    if db.client:
        db.client.close()
