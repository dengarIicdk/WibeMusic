# WibeMusic для Android

Клиент открывает веб-интерфейс сервера WibeMusic (Hub) внутри приложения.
Адрес сервера вводится один раз и сохраняется на устройстве.

## Сборка

Нужны JDK 17 и Gradle 8.9 (или Android Studio). На GitHub сборка идёт в workflow `.github/workflows/android.yml`.

```
cd mobile
gradle assembleDebug
```

APK: `mobile/app/build/outputs/apk/debug/app-debug.apk`.

## Возможности и ограничения

- APK — WebView-клиент, а не отдельный сервер. Сначала запустите Hub и Navidrome на своём ПК, затем в приложении укажите адрес Hub, например `http://192.168.1.10:8080` для домашней сети.
- Сборка выполняется GitHub Actions из `.github/workflows/android.yml`; после push в `master` APK скачивается из артефактов соответствующего запуска Actions, после version tag — со страницы GitHub Release.
- CI создаёт debug APK, который не подписан production-ключом. Перед регулярным распространением нужно настроить keystore, release-сборку и проверить APK на устройстве.
- APK собран и проверен на Android-устройстве: нет. На компьютере разработчика отсутствует Android SDK, поэтому локальная сборка не выполнялась; результат берётся из GitHub Actions (workflow `.github/workflows/android.yml`).
- В репозитории нет Gradle wrapper (`gradlew`): локальная сборка требует установленных JDK 17, Android SDK с platform 34 и Gradle 8.9. В CI Gradle ставится шагом `gradle/actions/setup-gradle`.
