# WibeMusic — текущее состояние

- Обновлено: 2026-11-14 (+03:00).
- Корень: `WibeMusic/` относительно папки с промптом (`Documents/Проект по умолчанию/WibeMusic`).
- Upstream: https://github.com/justman-1/HomeMusic-public.git (`origin`, не пушить); база проекта `509bb43dfb67c57fe515c0cf765a8e6c85132bdc`.
- Публикация: remote `wibemusic` — https://github.com/dengarIicdk/WibeMusic.git.
- Ветка / HEAD: master / `39538e7439b8a3199f04e65f3c64f490e7fd090c`; до текущей работы `wibemusic/master` был `33fefcb` (на один коммит позади).
- Этап / подзадача / статус: S09 / S09-T01 / DONE (CI, README и установщик пересобраны; Android — только через CI).

## Выполнено

- Прежние изменения «Мой Вайб», запрета 30-секундных превью и Deezer-подборок (S08-T01) сохранены, ничего не сбрасывалось.
- S09-T01: добавлены GitHub Actions — `checks.yml` (web build + Hub pytest, Ruff в режиме report-only), `windows-installer.yml` (production web build → Inno Setup → EXE), `android.yml` (JDK 17 + Gradle 8.9 → debug APK); на version tag сборки прикладываются к GitHub Release.
- `README.md` переписан по фактическому поведению: Windows — установщик, затем «Пуск» → WibeMusic, интерфейс `http://localhost:8080`, Navidrome `http://localhost:4533`, пароль `admin` в `%LOCALAPPDATA%\WibeMusic\secrets.json`, музыка в `%USERPROFILE%\Music\WibeMusic\library`, сканирование раз в час. Android описан как WebView-клиент без собственного сервера (API 24+, debug-подпись).
- `mobile/README.md` фиксирует отсутствие Gradle wrapper и сборку через CI.
- `.gitignore`: `web/tsconfig.tsbuildinfo` (и прежний `desktop/dist/`).

## Последние проверки

- `web/`: `npm run build` — typecheck и Vite production build прошли (15:20); `hub/app/static` обновлён (`index-COjWPlNM.js`, 602 кБ). Вложенному `npm run typecheck` нужен явный PATH с `/c/Program Files/nodejs`.
- Установщик пересобран: `desktop/dist/WibeMusic-Setup.exe` — 185 788 913 байт, 15:27 (прежний артефакт от 12:16 устарел). Сборка через `desktop/build-installer.ps1 -Uv <uv.exe>` завершилась с кодом 0.
- Содержимое EXE подтверждено тихой установкой во временный каталог: в установленном дереве `hub\app\static\index.html` ссылается на `index-COjWPlNM.js`, файл побайтно совпадает со свежей сборкой (SHA-256 `33b63ee6…fd14d68`) и содержит «Мой Вайб». Тестовая установка удалена, следов в автозапуске нет.
- YAML всех workflow разбирается; у шага Ruff `continue-on-error: true`.
- Ранее: Hub pytest на Multipass — 1076 passed, 74 skipped. Полный Ruff падает на существующих замечаниях проекта; массовая правка чужих файлов не выполнялась.

## Блокеры и ограничения

- Android APK локально не собран: нет Android SDK и Gradle. Проверка — только GitHub Actions; release-keystore не настроен.
- Живой запуск установленного клиента (меню «Пуск» → WibeMusic, браузер, воспроизведение) не выполнялся — проверено только содержимое установленного дерева.
- Полная браузерная приёмка подборок по-прежнему требует тестовой сессии; credentials в файлы не сохранялись.
- Не использовать `701288.myvds.top` и другие чужие адреса из исторической документации.

## Следующее действие

1. Отправить `master` в remote `wibemusic` (никогда не в `origin`) и проверить результат запусков `Checks`, `Windows installer` и `Android APK` в GitHub Actions.
2. После зелёного `Android APK` скачать artifact APK и проверить установку на устройстве.
3. При необходимости релиза — поставить version tag `v*`; без прямой просьбы тег не создавать.

## История среды

- Multipass `wibemusic` (Ubuntu 24.04, Docker), текущий IP проверять `multipass list`; при последней проверке — `172.27.160.225`.
- `uv` в PATH отсутствовал; использован `%APPDATA%\Python\Python315\Scripts\uv.exe`. Кэш загрузок сборки: `%LOCALAPPDATA%\Temp\opencode\build\installer`.

## Читать дальше

- `docs/IMPLEMENTATION-PLAN.md`
- `docs/progress/steps/S09-T01.md`
- `docs/DECISIONS.md` (D004), `JOURNAL.md`
- `../WibeMusic-PROMPT.md`
