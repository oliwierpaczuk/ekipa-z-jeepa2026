from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


# ================ MODELS ================

class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class NewsItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    excerpt: str
    body: str
    image: Optional[str] = None
    author: str = "Redakcja"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewsCreate(BaseModel):
    title: str
    excerpt: str
    body: str
    image: Optional[str] = None
    author: Optional[str] = "Redakcja"


class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    number: int
    position: str  # GK, DF, MF, FW
    photo: Optional[str] = None
    bio: Optional[str] = None
    goals: int = 0
    assists: int = 0
    appearances: int = 0


class PlayerCreate(BaseModel):
    name: str
    number: int
    position: str
    photo: Optional[str] = None
    bio: Optional[str] = None
    goals: int = 0
    assists: int = 0
    appearances: int = 0


class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    home_team: str
    away_team: str
    date: datetime
    venue: str
    competition: str = "Liga"
    status: str = "scheduled"  # scheduled | finished
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    summary: Optional[str] = None  # AI generated
    summary_is_ai: bool = False


class MatchCreate(BaseModel):
    home_team: str
    away_team: str
    date: datetime
    venue: str
    competition: str = "Liga"
    status: str = "scheduled"
    home_score: Optional[int] = None
    away_score: Optional[int] = None


class MatchUpdate(BaseModel):
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    date: Optional[datetime] = None
    venue: Optional[str] = None
    competition: Optional[str] = None
    status: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    summary: Optional[str] = None


class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    caption: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GalleryCreate(BaseModel):
    url: str
    caption: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


# ================ APP ================

app = FastAPI(title="EKIPA Z JEEPA API")
api_router = APIRouter(prefix="/api")


# ================ AUTH HELPERS ================

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Brak autoryzacji")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Nieprawidłowy token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Użytkownik nie istnieje")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token wygasł")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
    return user


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")


# ================ AUTH ROUTES ================

@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")
    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


@api_router.post("/auth/logout")
async def logout(response: Response, _user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Brak refresh tokena")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Nieprawidłowy typ")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Brak użytkownika")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=43200, path="/")
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Nieprawidłowy refresh token")


# ================ NEWS ================

@api_router.get("/news", response_model=List[NewsItem])
async def list_news(limit: int = 20):
    items = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return items


@api_router.get("/news/{news_id}", response_model=NewsItem)
async def get_news(news_id: str):
    item = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return item


@api_router.post("/news", response_model=NewsItem)
async def create_news(payload: NewsCreate, _admin: dict = Depends(require_admin)):
    item = NewsItem(**payload.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.news.insert_one(doc)
    return item


@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str, _admin: dict = Depends(require_admin)):
    res = await db.news.delete_one({"id": news_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return {"ok": True}


# ================ PLAYERS ================

@api_router.get("/players", response_model=List[Player])
async def list_players():
    items = await db.players.find({}, {"_id": 0}).sort("number", 1).to_list(100)
    return items


@api_router.post("/players", response_model=Player)
async def create_player(payload: PlayerCreate, _admin: dict = Depends(require_admin)):
    item = Player(**payload.model_dump())
    await db.players.insert_one(item.model_dump())
    return item


@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str, _admin: dict = Depends(require_admin)):
    res = await db.players.delete_one({"id": player_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return {"ok": True}


# ================ MATCHES ================

def _parse_match_doc(doc):
    if isinstance(doc.get("date"), str):
        try:
            doc["date"] = datetime.fromisoformat(doc["date"])
        except ValueError:
            pass
    return doc


@api_router.get("/matches", response_model=List[Match])
async def list_matches(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    items = await db.matches.find(query, {"_id": 0}).sort("date", 1).to_list(200)
    return [_parse_match_doc(i) for i in items]


@api_router.get("/matches/{match_id}", response_model=Match)
async def get_match(match_id: str):
    item = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return _parse_match_doc(item)


@api_router.post("/matches", response_model=Match)
async def create_match(payload: MatchCreate, _admin: dict = Depends(require_admin)):
    item = Match(**payload.model_dump())
    doc = item.model_dump()
    doc["date"] = doc["date"].isoformat()
    await db.matches.insert_one(doc)
    return item


@api_router.patch("/matches/{match_id}", response_model=Match)
async def update_match(match_id: str, payload: MatchUpdate, _admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "date" in updates and isinstance(updates["date"], datetime):
        updates["date"] = updates["date"].isoformat()
    if not updates:
        raise HTTPException(status_code=400, detail="Brak danych do aktualizacji")
    res = await db.matches.update_one({"id": match_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    item = await db.matches.find_one({"id": match_id}, {"_id": 0})
    return _parse_match_doc(item)


@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str, _admin: dict = Depends(require_admin)):
    res = await db.matches.delete_one({"id": match_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return {"ok": True}


# ================ AI ================

CLUB_CONTEXT = (
    "Jesteś oficjalnym asystentem AI klubu piłkarskiego EKIPA Z JEEPA. "
    "Klub gra w barwach różowych. Odpowiadasz po polsku, krótko i z energią kibica. "
    "Pomagasz fanom dowiedzieć się o klubie, zawodnikach, meczach i historii. "
    "Jeśli nie znasz konkretnej odpowiedzi, zaproponuj kontakt z klubem."
)


@api_router.post("/ai/match-summary/{match_id}")
async def ai_match_summary(match_id: str, _admin: dict = Depends(require_admin)):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Nie znaleziono meczu")
    if match.get("status") != "finished" or match.get("home_score") is None:
        raise HTTPException(status_code=400, detail="Mecz musi być zakończony z wynikiem")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"match-summary-{match_id}",
            system_message=(
                "Jesteś dziennikarzem sportowym klubu EKIPA Z JEEPA. "
                "Tworzysz krótkie, energetyczne podsumowania meczów po polsku (3-5 zdań), "
                "pełne emocji ale rzeczowe. Bez emoji."
            ),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        prompt = (
            f"Napisz podsumowanie meczu {match['home_team']} vs {match['away_team']} "
            f"({match.get('competition', 'Liga')}) zakończonego wynikiem "
            f"{match['home_score']}:{match['away_score']}. Stadion: {match['venue']}."
        )
        reply = await chat.send_message(UserMessage(text=prompt))
        await db.matches.update_one(
            {"id": match_id},
            {"$set": {"summary": reply, "summary_is_ai": True}},
        )
        return {"summary": reply}
    except Exception as e:
        logger.exception("AI summary failed")
        raise HTTPException(status_code=500, detail=f"Błąd AI: {str(e)}")


@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(payload: ChatRequest):
    session_id = payload.session_id or str(uuid.uuid4())
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        # Build context with recent club data
        players = await db.players.find({}, {"_id": 0, "name": 1, "number": 1, "position": 1}).to_list(50)
        upcoming = await db.matches.find({"status": "scheduled"}, {"_id": 0}).sort("date", 1).to_list(5)
        finished = await db.matches.find({"status": "finished"}, {"_id": 0}).sort("date", -1).to_list(5)

        club_data = "AKTUALNE DANE KLUBU:\n"
        if players:
            club_data += "Zawodnicy: " + ", ".join([f"#{p['number']} {p['name']} ({p['position']})" for p in players[:15]]) + "\n"
        if upcoming:
            club_data += "Najbliższe mecze: " + "; ".join([f"{m['home_team']} vs {m['away_team']} ({m['date'][:10] if isinstance(m['date'], str) else m['date']})" for m in upcoming[:3]]) + "\n"
        if finished:
            club_data += "Ostatnie wyniki: " + "; ".join([f"{m['home_team']} {m.get('home_score','-')}:{m.get('away_score','-')} {m['away_team']}" for m in finished[:3]]) + "\n"

        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=session_id,
            system_message=CLUB_CONTEXT + "\n\n" + club_data,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        reply = await chat.send_message(UserMessage(text=payload.message))
        await db.chat_messages.insert_one({
            "session_id": session_id,
            "user": payload.message,
            "assistant": reply,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return ChatResponse(reply=reply, session_id=session_id)
    except Exception as e:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail=f"Błąd AI: {str(e)}")


# ================ GALLERY ================

@api_router.get("/gallery", response_model=List[GalleryItem])
async def list_gallery():
    items = await db.gallery.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.post("/gallery", response_model=GalleryItem)
async def add_gallery(payload: GalleryCreate, _admin: dict = Depends(require_admin)):
    item = GalleryItem(**payload.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.gallery.insert_one(doc)
    return item


@api_router.delete("/gallery/{item_id}")
async def delete_gallery(item_id: str, _admin: dict = Depends(require_admin)):
    res = await db.gallery.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"name": "EKIPA Z JEEPA API", "status": "ok"}


# ================ INCLUDE ROUTER ================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ================ STARTUP ================

async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@ekipazjeepa.pl").lower()
    password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {email}")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": hash_password(password)}},
        )
        logger.info("Admin password updated")


async def seed_demo_data():
    if await db.players.count_documents({}) == 0:
        demo_players = [
            {"name": "Kamil Mazur", "number": 1, "position": "GK", "goals": 0, "assists": 0, "appearances": 18, "bio": "Kapitan bramki, mur z różowymi rękawicami."},
            {"name": "Bartek Wojciechowski", "number": 4, "position": "DF", "goals": 1, "assists": 2, "appearances": 17, "bio": "Stoper z charakterem."},
            {"name": "Patryk Lis", "number": 5, "position": "DF", "goals": 0, "assists": 1, "appearances": 16},
            {"name": "Tomek Górski", "number": 6, "position": "MF", "goals": 3, "assists": 5, "appearances": 18, "bio": "Mózg drugiej linii."},
            {"name": "Adrian Zieliński", "number": 8, "position": "MF", "goals": 4, "assists": 4, "appearances": 17},
            {"name": "Michał Sokół", "number": 10, "position": "MF", "goals": 9, "assists": 7, "appearances": 18, "bio": "Numer dziesięć. Reżyser ataku."},
            {"name": "Kuba Nowak", "number": 9, "position": "FW", "goals": 14, "assists": 3, "appearances": 18, "bio": "Najlepszy strzelec sezonu."},
            {"name": "Igor Pawlak", "number": 11, "position": "FW", "goals": 6, "assists": 5, "appearances": 16},
            {"name": "Filip Kowal", "number": 7, "position": "FW", "goals": 5, "assists": 6, "appearances": 17},
            {"name": "Łukasz Wrona", "number": 3, "position": "DF", "goals": 0, "assists": 1, "appearances": 15},
        ]
        for p in demo_players:
            obj = Player(**p)
            await db.players.insert_one(obj.model_dump())
        logger.info("Seeded demo players")

    if await db.matches.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        demo_matches = [
            {"home_team": "EKIPA Z JEEPA", "away_team": "FC Burza", "date": now + timedelta(days=3), "venue": "Stadion Miejski", "competition": "Liga Okręgowa", "status": "scheduled"},
            {"home_team": "Czarni Las", "away_team": "EKIPA Z JEEPA", "date": now + timedelta(days=10), "venue": "Park Sportowy Las", "competition": "Liga Okręgowa", "status": "scheduled"},
            {"home_team": "EKIPA Z JEEPA", "away_team": "Orły Wschodu", "date": now + timedelta(days=17), "venue": "Stadion Miejski", "competition": "Puchar Polski", "status": "scheduled"},
            {"home_team": "EKIPA Z JEEPA", "away_team": "Tytan Górki", "date": now - timedelta(days=4), "venue": "Stadion Miejski", "competition": "Liga Okręgowa", "status": "finished", "home_score": 3, "away_score": 1},
            {"home_team": "Lwy Doliny", "away_team": "EKIPA Z JEEPA", "date": now - timedelta(days=11), "venue": "Stadion Doliny", "competition": "Liga Okręgowa", "status": "finished", "home_score": 0, "away_score": 2},
            {"home_team": "EKIPA Z JEEPA", "away_team": "Sokół Wzgórze", "date": now - timedelta(days=18), "venue": "Stadion Miejski", "competition": "Liga Okręgowa", "status": "finished", "home_score": 4, "away_score": 2},
        ]
        for m in demo_matches:
            obj = Match(**m)
            doc = obj.model_dump()
            doc["date"] = doc["date"].isoformat()
            await db.matches.insert_one(doc)
        logger.info("Seeded demo matches")

    if await db.news.count_documents({}) == 0:
        demo_news = [
            {"title": "Powrót w wielkim stylu — 3:1 z Tytanem!", "excerpt": "Pewne zwycięstwo na własnym stadionie.", "body": "Nasza drużyna pokazała pełen kunszt taktyczny i wolę walki. Trzy gole, trzy punkty, jedność.", "image": "https://images.pexels.com/photos/13907421/pexels-photo-13907421.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
            {"title": "Nowy transfer — Igor Pawlak dołącza do ataku", "excerpt": "Wzmocnienie ofensywy przed startem rundy.", "body": "Z dumą ogłaszamy podpisanie kontraktu z Igorem Pawlakiem. Snajper z 24 golami w poprzednim sezonie."},
            {"title": "Otwarty trening dla kibiców już w sobotę", "excerpt": "Spotkanie z drużyną i autografy.", "body": "Zapraszamy całe rodziny na otwarty trening. Atrakcje, konkursy, sektor gastronomiczny i pamiątki."},
        ]
        for n in demo_news:
            obj = NewsItem(**n)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.news.insert_one(doc)
        logger.info("Seeded demo news")

    if await db.gallery.count_documents({}) == 0:
        urls = [
            "https://images.unsplash.com/photo-1763494392794-a07d77898569?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
            "https://images.pexels.com/photos/13907421/pexels-photo-13907421.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/221253/pexels-photo-221253.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=1200",
            "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200",
            "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200",
        ]
        for u in urls:
            obj = GalleryItem(url=u)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.gallery.insert_one(doc)
        logger.info("Seeded gallery")


@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.players.create_index("number")
    await db.matches.create_index("date")
    await seed_admin()
    await seed_demo_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
