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

## Что дальше

- Сервер внутри APK (Chaquopy) не сделан: Hub тяжёлый, нужна проверка на ARM.
- Не проверено на устройстве: сборка и запуск ещё не выполнялись, Android SDK на сборочной машине не установлен.
- Для релиза нужна подпись APK (keystore) и `release`-сборка.
