from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"


class UserPublic(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    role: str = "user"

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class UserInDB(UserPublic):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class TermBase(BaseModel):
    kz: str
    ru: str
    en: Optional[str] = None
    category: str = "Фармацевтика"
    aliases: List[str] = Field(default_factory=list)
    deprecated: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class TermCreate(TermBase):
    pass


class TermUpdate(BaseModel):
    kz: Optional[str] = None
    ru: Optional[str] = None
    en: Optional[str] = None
    category: Optional[str] = None
    aliases: Optional[List[str]] = None
    deprecated: Optional[List[str]] = None
    notes: Optional[str] = None


class TermInDB(TermBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class CheckRequest(BaseModel):
    text: str
    language: str = "kz"
    save_history: bool = False


class CheckResultItem(BaseModel):
    word: str
    status: str
    suggestion: Optional[str] = None
    original: str
    reason: Optional[str] = None
    term: Optional[Dict[str, Any]] = None
    score: Optional[int] = None


class CheckResponse(BaseModel):
    results: List[CheckResultItem]
    stats: Dict[str, Any]
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)


class HistoryInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_email: str
    language: str
    source: str = "text"
    created_at: datetime
    stats: Dict[str, Any]
    preview: str

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }
