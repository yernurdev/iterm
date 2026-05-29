import asyncio
import re
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from database.mongo import close_mongo_connection, connect_to_mongo, get_database

BASE_FILE = Path(__file__).resolve().parents[2] / "iterm_base" / "последний_вариант_фарм_терминовсентябрь_2018_.doc.md"


def fix_mojibake(value: str) -> str:
    try:
        return value.encode("cp1251").decode("utf-8")
    except UnicodeError:
        return value


def clean_cell(value: str) -> str:
    value = fix_mojibake(value)
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = re.sub(r"https?://\S+", "", value)
    value = value.replace("\\-", "-").replace("\\.", ".")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


async def import_data():
    await connect_to_mongo()
    db = await get_database()

    if not BASE_FILE.exists():
        raise FileNotFoundError(f"Base file not found: {BASE_FILE}")

    await db.terms.delete_many({})
    imported_count = 0

    for line in BASE_FILE.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue

        parts = [part.strip() for part in line.split("|")]
        if len(parts) < 4 or "---" in line:
            continue

        ru_term = clean_cell(parts[2])
        kz_term = clean_cell(parts[3])
        if not ru_term or not kz_term or "термины на русском языке" in ru_term.lower():
            continue

        await db.terms.insert_one(
            {
                "ru": ru_term,
                "kz": kz_term,
                "en": None,
                "category": "Фармацевтика",
                "aliases": [],
                "deprecated": [],
                "notes": None,
            }
        )
        imported_count += 1

    print(f"Imported {imported_count} terms from {BASE_FILE}")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(import_data())
