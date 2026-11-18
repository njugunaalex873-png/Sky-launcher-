# SKY LAUNCHER — Android APK Build Guide

This repository contains both the React + TypeScript launcher interface (`/src`) and the native Android Kotlin launcher project (`/android`) configured with:

- `CATEGORY_HOME` + `CATEGORY_DEFAULT` registration in `AndroidManifest.xml`
- `QUERY_ALL_PACKAGES` and `<queries>` package discovery via Android `PackageManager`
- Native app launching, App Info, and Uninstall intents via `SkyLauncherBridge.kt`
- Home-button (`onNewIntent`) reset to Sky Launcher's Home screen, hardware Back navigation, and live `PACKAGE_ADDED` / `PACKAGE_REMOVED` / `PACKAGE_REPLACED` broadcasts in `MainActivity.kt`
- Monochrome adaptive launcher icon (`@mipmap/ic_launcher`) and opt-in `NotificationListenerService`

---

## Prerequisites (Local / CI Machine)
- **Node.js 20+**
- **Android Studio (Ladybug or newer)** with **Android SDK API 35** and **JDK 17**

---

## Step 1 — Sync the Built Web App into Android Assets
Whenever you update the UI, rebuild and copy `dist/` into `android/app/src/main/assets/dist/`:

```bash
npm install
npm run android:sync
```

*(Note: `npm run android:sync` is already run in this repo so `android/app/src/main/assets/dist/` is pre-populated.)*

---

## Step 2 — Open in Android Studio & Build the APK

1. Open **Android Studio** → **Open** → select the **`android/`** folder inside this project.
2. Wait for **Gradle Sync** to finish (Android Studio will automatically download Gradle and Android SDK dependencies using `gradle-wrapper` or your local Gradle setup).
3. Click **Build → Build Bundle(s) / APK(s) → Build APK(s)** (or run `gradle assembleDebug` inside `android/` if Gradle CLI is installed).
4. Locate the generated APK at:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## Step 3 — Install & Set as Default Home Launcher

1. Install onto your connected Android phone (USB Debugging enabled):
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. Press the **Home** button on your phone and select **SKY LAUNCHER → Always** (or go to **Android Settings → Apps → Default apps → Home app → SKY LAUNCHER**).
3. Verify on your device:
   - Your Home screen clock, 8 favorite installed apps, and swipe-up Search work smoothly.
   - Pressing **Apps** opens the 3D circular app wheel with all real installed apps and launches them.
   - Pressing **Hide App** opens the Hide Apps page.
   - Pressing the Android **Home** button from inside any app or Sky Launcher view returns directly to Sky Launcher's Home screen.
