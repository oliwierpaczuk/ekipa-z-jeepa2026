import os
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://team-connect-139.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@ekipazjeepa.pl"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def public():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies
    return s


# Health
def test_root(public):
    r = public.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# Auth
def test_login_invalid(public):
    r = public.post(f"{API}/auth/login", json={"email": "wrong@x.com", "password": "bad"}, timeout=10)
    assert r.status_code == 401


def test_me_with_cookie(admin):
    r = admin.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


def test_me_without_cookie(public):
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


# Public lists
def test_news_list(public):
    r = public.get(f"{API}/news", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 3


def test_players_list(public):
    r = public.get(f"{API}/players", timeout=10)
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 10
    assert all("name" in p and "number" in p for p in items)


def test_matches_list(public):
    r = public.get(f"{API}/matches", timeout=10)
    assert r.status_code == 200
    assert len(r.json()) >= 6


def test_matches_filter_finished(public):
    r = public.get(f"{API}/matches", params={"status": "finished"}, timeout=10)
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    assert all(m["status"] == "finished" for m in items)


def test_matches_filter_scheduled(public):
    r = public.get(f"{API}/matches", params={"status": "scheduled"}, timeout=10)
    assert r.status_code == 200
    assert all(m["status"] == "scheduled" for m in r.json())


def test_gallery_list(public):
    r = public.get(f"{API}/gallery", timeout=10)
    assert r.status_code == 200
    assert len(r.json()) >= 6


# Admin auth required
def test_news_create_requires_auth(public):
    r = requests.post(f"{API}/news", json={"title": "x", "excerpt": "x", "body": "x"}, timeout=10)
    assert r.status_code == 401


def test_player_create_requires_auth():
    r = requests.post(f"{API}/players", json={"name": "x", "number": 99, "position": "FW"}, timeout=10)
    assert r.status_code == 401


def test_match_create_requires_auth():
    r = requests.post(f"{API}/matches", json={"home_team": "a", "away_team": "b", "date": datetime.now(timezone.utc).isoformat(), "venue": "x"}, timeout=10)
    assert r.status_code == 401


def test_gallery_create_requires_auth():
    r = requests.post(f"{API}/gallery", json={"url": "https://x"}, timeout=10)
    assert r.status_code == 401


# Admin CRUD
def test_news_crud(admin):
    payload = {"title": "TEST_News", "excerpt": "ex", "body": "body"}
    r = admin.post(f"{API}/news", json=payload, timeout=10)
    assert r.status_code == 200
    nid = r.json()["id"]
    g = admin.get(f"{API}/news/{nid}", timeout=10)
    assert g.status_code == 200
    assert g.json()["title"] == "TEST_News"
    d = admin.delete(f"{API}/news/{nid}", timeout=10)
    assert d.status_code == 200


def test_player_crud(admin):
    payload = {"name": "TEST_Player", "number": 88, "position": "MF"}
    r = admin.post(f"{API}/players", json=payload, timeout=10)
    assert r.status_code == 200
    pid = r.json()["id"]
    d = admin.delete(f"{API}/players/{pid}", timeout=10)
    assert d.status_code == 200


def test_match_crud_and_patch(admin):
    payload = {
        "home_team": "TEST_Home", "away_team": "TEST_Away",
        "date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "venue": "TEST_Venue", "status": "scheduled",
    }
    r = admin.post(f"{API}/matches", json=payload, timeout=10)
    assert r.status_code == 200
    mid = r.json()["id"]
    p = admin.patch(f"{API}/matches/{mid}", json={"status": "finished", "home_score": 2, "away_score": 1}, timeout=10)
    assert p.status_code == 200
    assert p.json()["status"] == "finished"
    assert p.json()["home_score"] == 2
    d = admin.delete(f"{API}/matches/{mid}", timeout=10)
    assert d.status_code == 200


def test_gallery_crud(admin):
    r = admin.post(f"{API}/gallery", json={"url": "https://example.com/x.jpg", "caption": "TEST_cap"}, timeout=10)
    assert r.status_code == 200
    gid = r.json()["id"]
    d = admin.delete(f"{API}/gallery/{gid}", timeout=10)
    assert d.status_code == 200


def test_logout(admin):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    r = s.post(f"{API}/auth/logout", timeout=10)
    assert r.status_code == 200
    me = s.get(f"{API}/auth/me", timeout=10)
    assert me.status_code == 401


# AI
def test_ai_chat(public):
    r = public.post(f"{API}/ai/chat", json={"message": "Kto jest najlepszym strzelcem?"}, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "reply" in data and len(data["reply"]) > 0
    assert "session_id" in data


def test_ai_match_summary(admin):
    r = admin.get(f"{API}/matches", params={"status": "finished"}, timeout=10)
    finished = r.json()
    assert len(finished) >= 1
    mid = finished[0]["id"]
    s = admin.post(f"{API}/ai/match-summary/{mid}", timeout=60)
    assert s.status_code == 200, s.text
    assert "summary" in s.json() and len(s.json()["summary"]) > 10
