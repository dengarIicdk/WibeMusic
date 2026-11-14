# WibeMusic — текущее состояние

- Обновлено: 2026-11-13 (+03:00)
- Корень: `WibeMusic/` относительно папки с промптом.
- Upstream: https://github.com/justman-1/HomeMusic-public.git, master, `509bb43dfb67c57fe515c0cf765a8e6c85132bdc`.
- Ветка / HEAD: master / тот же SHA. Изменения не закоммичены.
- Этап / подзадача / статус: S07 / S07-T01 / ЧАСТИЧНО ПРИНЯТО (статика и сборка; реальная проверка BLOCKED — Docker не работает в этой Windows).
- Последняя завершённая точка: попытка установить Docker зафиксирована; Docker удалён, решение — вариант 3 (без Docker).

## Выполнено
- S01: аудит маршрутов, токенов, PWA, API и плеера.
- S02: бренд WibeMusic, мятно-бирюзовые токены, иконки, `docs/DESIGN.md`, пустая главная.
- S03–S05: аудит по коду (вход, поиск, плеер, очередь, плейлисты, загрузки, PWA, Share Target). Изменений кода нет.
- S06-T01: профили compose (`embedder` → `gpu`, `tunnel` → `vps`, `slskd` → `soulseek`), `VPS_HOST` необязательный на уровне compose, `.env.example` дополнен.
- S06-T02: `README.md` приведён в соответствие с профилями.
- S07-T01: итоговый отчёт записан (статическая часть).
- Решение D003: upstream `.gitignore` игнорирует `AGENTS.md`.

## Блокеры
- Docker Desktop не работает: установщик падает (winget код 1, официальный -5), журнала с причиной нет. Удалён полностью.
- WSL: пакет 3.0.5 установлен, но компонент `Microsoft-Windows-Subsystem-Linux` отсутствует в образе Windows 11 IoT Enterprise (DISM 0x800f080c). `wsl --status` требует его.
- Не проверены: `docker compose config`/`up`, вход, поиск, воспроизведение, Share Target, офлайн, адаптивность 360/390/768/1440 px, телефон и HTTPS.
- uv не установлен: backend Ruff и pytest не запускались.

## Открыто для владельца
1. `COMPOSE_PROFILES` в его `.env` (не менялся): если задан, должен включать `vps` и `gpu` по необходимости.
2. Текст «Tempus» в `web/src/pages/Playlists.tsx`: оставить, убрать или заменить на WibeMusic.
3. High-уязвимость npm: исправлять ли (`npm audit fix` может сменить версии).
4. Разрешить ли коммит всех изменений.
5. Для Docker нужна поддерживаемая среда: Windows 11 Pro/Home (IoT Enterprise не поддерживает WSL-компонент в этой сборке) или отдельный Linux-хост/VPS.

## Незакоммиченные изменения
- Модифицированы: `.env.example`, `docker-compose.yml`, `README.md`, `web/` (бренд, токены, иконки, страницы), `hub/app/static` (сборка).
- Новое: `docs/`.

## Стек запущен в виртуалке (2026-11-13)
- Виртуалка Multipass `wibemusic` (Ubuntu 24.04, 4 CPU, 6 ГБ), IP `172.27.171.55`.
- Docker 29.1.3, Compose 2.40.3. Проект `~/WibeMusic`, тестовый `.env` (секреты сгенерированы в виртуалке, `MUSIC_ROOT=/home/ubuntu/music`, COMPOSE_PROFILES пуст).
- Запущены: `hub` (healthy, миграции Alembic прошли), `navidrome` (0.64.2), `youtube-pot` (healthy). Профили `gpu`, `vps`, `soulseek` не запускались.
- С Windows: `http://172.27.160.225:8080/` → 200, `:4533/` → 200 (IP изменился после переноса; узнавать через `multipass list`).
- Данные Multipass (VHDX виртуалки) перенесены на Z: через junction: `C:\ProgramData\Multipass` → `Z:\WibeMusic-backup\Multipass` (резерв на Z:, копия проверена по размеру). Старый оригинал на C: удалён.
- Страница входа WibeMusic открывается в браузере на ПК (`http://172.27.171.55:8080`).
- Backend pytest (`hub/`, uv 0.13.8, Python 3.12): 1076 passed, 74 skipped, 0 failed.
- Ruff `hub/`: 90 замечаний (58 исправляются автоматически). Код не менялся; решение о правках — владельцу.
- Вход в Hub работает: `POST /api/auth/login` с админом Navidrome из тестового `.env` → 200, `is_admin: true`. После входа 200: `/api/auth/me`, `/api/search`, `/api/playlists`, `/api/admin/users`. Ошибок ERROR в логе Hub нет.
- Найденные и исправленные ошибки тестового `.env` (только в виртуалке): `HUB_SECRET_KEY` и `ND_PASSWORDENCRYPTIONKEY` должны быть ключами Fernet (base64 от 32 байт), а не hex. Тома Navidrome и Hub пересозданы, первый администратор Navidrome создан заново.
- Не проверено: плеер, Share Target, адаптивность, телефон, HTTPS, офлайн.

## Десктоп-набор без Docker (2026-11-14)
- Набор собран в `%TEMP%\opencode\build\stage`: Python 3.12.16, зависимости Hub, Navidrome 0.64.2, Deno, ffmpeg/ffprobe.
- Лаунчер `desktop/launcher.py` проверен из набора: Hub `/healthz` 200 (`navidrome: true`), Navidrome `/ping` 200, вход администратора `/api/auth/login` 200, `--stop` останавливает процессы.
- Исправлено в ходе проверки: путь к `site` (зависимости в корне набора), импорт `cryptography` до `sys.path`, `INSTALL` = папка лаунчера.
- Не проверено: сам установщик Inno Setup (не собран), установка на чистой Windows, автостарт, создание пользователя Navidrome через мастер, Android-клиент.
- Установщик собран: `desktop/build-installer.ps1` → `desktop/dist/WibeMusic-Setup.exe` (167 МБ, ISCC `desktop/WibeMusic.iss`, иконка `desktop/wibemusic.ico`). Тихая установка `/VERYSILENT` → код 0, файлы на месте. Установленная копия в чистом профиле: Hub и Navidrome поднимаются, `/api/auth/me` → admin (200), с `X-Forwarded-For` → 401.
- Исправлено при проверке: автовход в чистой базе создаёт администратора через вход Navidrome (раньше 401, т.к. записи админа в базе Hub не было). Во время проверки старые процессы Hub держали порт 8080 — перед тестом проверять `Get-NetTCPConnection -LocalPort 8080,4533`.
- Причина «Нет связи с сервером»: лаунчер останавливался при закрытии, и сервисы не запускались. Исправлено: сервисы перезапускаются при падении, второй экземпляр не стартует (проверка по `/healthz`), в установщике есть задача автозапуска (`HKCU\...\Run`, `pythonw.exe`).
- Установщик пересобран и проверен тихой установкой (код 0): `/api/auth/me` 200, второй экземпляр выходит с кодом 0, после остановки Hub лаунчер поднимает его снова.
- Не проверено: установка на чистой Windows, удаление установки, открытие страницы в браузере после автовхода.
- Локальный автовход (только десктоп-набор): `hub/app/auth.py` `_local_autologin`, включается `WIBEMUSIC_LOCAL_AUTOLOGIN=1` (лаунчер ставит её). Прямой запрос на localhost → администратор без куки; запрос с `X-Forwarded-For`/`X-Real-IP`/`Forwarded` или не с 127.0.0.1 не получает доступа (проверено: `/api/auth/me` 200 локально, 401 с прокси-заголовком). Без переменной поведение сервера не меняется.

## Среда для Docker (в работе)
- Выбран путь: виртуалка Ubuntu через Multipass (Hyper-V). Видеокарты в ней нет, поэтому профиль `gpu` (embedder) не запускается; базовый стек работает.
- Установлено: Hyper-V (DISM, перезагрузка нужна), Multipass 1.16.4 (драйвер `hyperv`).
- Следующий шаг после перезагрузки: `multipass launch 24.04 --name wibemusic --cpus 4 --memory 6G --disk 40G`, затем установить Docker Engine внутри (Ubuntu) и поднять `WibeMusic/` с `COMPOSE_PROFILES` без `gpu`/`vps`.

## Следующее действие
1. Перезагрузить ПК, затем создать виртуалку Multipass (см. выше).
2. Когда среда будет готова: `docker compose config`, `docker compose up -d`, затем реальная проверка S03–S05 в браузере с явным `tabID`.
3. Не менять `HomeMusicAndroid`, `hm_session`, заголовки, compose-идентификаторы, маршруты и аудиосостояние.

## Читать дальше
- `docs/IMPLEMENTATION-PLAN.md`
- `docs/progress/steps/S07-T01.md`
- `../WibeMusic-PROMPT.md`
