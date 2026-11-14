"""WibeMusic desktop launcher: starts Navidrome and the Hub locally, then opens the app in a browser.

Runs from the installed folder with the bundled Python (no system Python, Docker or Node needed).
Data lives in %LOCALAPPDATA%\\WibeMusic; secrets are generated once on first start.
"""

from __future__ import annotations

import json
import os
import secrets
import subprocess
import sys
import time
import urllib.request
import webbrowser
from pathlib import Path

INSTALL = Path(__file__).resolve().parent
DATA = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "WibeMusic"
MUSIC = Path(os.environ.get("WIBEMUSIC_MUSIC", str(Path.home() / "Music" / "WibeMusic")))
HUB_PORT = 8080
ND_PORT = 4533
PID_FILE = DATA / "pids.json"
SECRETS_FILE = DATA / "secrets.json"
LOG_DIR = DATA / "logs"


def load_or_create_secrets() -> dict:
    if SECRETS_FILE.exists():
        return json.loads(SECRETS_FILE.read_text(encoding="utf-8"))
    sys.path.insert(0, str(INSTALL / "site"))
    from cryptography.fernet import Fernet

    data = {
        "hub_secret_key": Fernet.generate_key().decode(),
        "nd_encryption_key": Fernet.generate_key().decode(),
        "admin_user": "admin",
        "admin_password": secrets.token_urlsafe(18),
    }
    DATA.mkdir(parents=True, exist_ok=True)
    SECRETS_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


def wait_http(url: str, timeout: float = 60) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=3):
                return True
        except Exception:
            time.sleep(1)
    return False


def start(args: list[str], env: dict, log_name: str, cwd: Path) -> subprocess.Popen:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log = open(LOG_DIR / f"{log_name}.log", "ab")
    flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
    return subprocess.Popen(args, env=env, cwd=cwd, stdout=log, stderr=log, creationflags=flags)


def main() -> int:
    if "--stop" in sys.argv:
        if PID_FILE.exists():
            for pid in json.loads(PID_FILE.read_text()).values():
                subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
            PID_FILE.unlink()
        return 0

    if wait_http(f"http://127.0.0.1:{HUB_PORT}/healthz", timeout=2):
        webbrowser.open(f"http://localhost:{HUB_PORT}")
        return 0

    cfg = load_or_create_secrets()
    MUSIC.mkdir(parents=True, exist_ok=True)
    (DATA / "navidrome").mkdir(parents=True, exist_ok=True)
    (DATA / "hub").mkdir(parents=True, exist_ok=True)
    (MUSIC / "library").mkdir(exist_ok=True)

    nd_env = dict(os.environ)
    nd_env.update({
        "ND_MUSICFOLDER": str(MUSIC / "library"),
        "ND_DATAFOLDER": str(DATA / "navidrome"),
        "ND_PORT": str(ND_PORT),
        "ND_ADDRESS": "0.0.0.0",
        "ND_CONFIGFILE": str(INSTALL / "navidrome" / "navidrome.toml"),
        "ND_DEFAULTLANGUAGE": "ru",
        "ND_SCANSCHEDULE": "1h",
        "ND_SCANNER_WATCHERENABLED": "false",
        "ND_AUTOIMPORTPLAYLISTS": "false",
        "ND_ENABLEINSIGHTSCOLLECTOR": "false",
        "ND_ENABLESHARING": "true",
        "ND_PASSWORDENCRYPTIONKEY": cfg["nd_encryption_key"],
        "ND_DEVAUTOCREATEADMINPASSWORD": cfg["admin_password"],
        "ND_DEVAUTOCREATEADMINUSER": cfg["admin_user"],
    })
    navidrome = start([str(INSTALL / "bin" / "navidrome.exe")], nd_env, "navidrome", DATA / "navidrome")

    hub_env = dict(os.environ)
    hub_env.update({
        "PYTHONPATH": f"{INSTALL / 'site'};{INSTALL / 'hub'}",
        "PYTHONUNBUFFERED": "1",
        "PATH": f"{INSTALL / 'bin'};{hub_env.get('PATH', '')}",
        "MUSIC_ROOT": str(MUSIC),
        "DATA_DIR": str(DATA / "hub"),
        "CONFIG_FILE": str(INSTALL / "config.example.yaml"),
        "STATIC_DIR": str(INSTALL / "hub" / "app" / "static"),
        "NAVIDROME_URL": f"http://127.0.0.1:{ND_PORT}",
        "NAVIDROME_ADMIN_USER": cfg["admin_user"],
        "NAVIDROME_ADMIN_PASSWORD": cfg["admin_password"],
        "HUB_SECRET_KEY": cfg["hub_secret_key"],
        "PUBLIC_HUB_URL": f"http://localhost:{HUB_PORT}",
        "PUBLIC_MUSIC_URL": f"http://localhost:{ND_PORT}",
        "FFMPEG_BIN": str(INSTALL / "bin" / "ffmpeg.exe"),
        "LOG_LEVEL": "INFO",
        "WIBEMUSIC_LOCAL_AUTOLOGIN": "1",
    })
    hub = start([str(INSTALL / "python" / "python.exe"), "-m", "uvicorn", "app.main:app",
                 "--host", "0.0.0.0", "--port", str(HUB_PORT)], hub_env, "hub", INSTALL / "hub")

    PID_FILE.write_text(json.dumps({"navidrome": navidrome.pid, "hub": hub.pid}))

    if wait_http(f"http://127.0.0.1:{HUB_PORT}/healthz"):
        webbrowser.open(f"http://localhost:{HUB_PORT}")
    while True:
        if hub.poll() is not None or navidrome.poll() is not None:
            time.sleep(5)
            if hub.poll() is not None:
                hub = start([str(INSTALL / "python" / "python.exe"), "-m", "uvicorn", "app.main:app",
                             "--host", "0.0.0.0", "--port", str(HUB_PORT)], hub_env, "hub", INSTALL / "hub")
            if navidrome.poll() is not None:
                navidrome = start([str(INSTALL / "bin" / "navidrome.exe")], nd_env, "navidrome", DATA / "navidrome")
            PID_FILE.write_text(json.dumps({"navidrome": navidrome.pid, "hub": hub.pid}))
        time.sleep(5)


if __name__ == "__main__":
    raise SystemExit(main())
