package com.skylauncher.app

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.util.Base64
import android.util.LruCache
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

class SkyLauncherBridge(private val activity: MainActivity) {

    private val context: Context get() = activity
    private val iconCache = LruCache<String, String>(300)
    private var torchEnabled = false

    fun clearIconCache() {
        iconCache.evictAll()
    }

    @JavascriptInterface
    fun getInstalledApps(): String {
        val pm = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.queryIntentActivities(
                intent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(intent, 0)
        }

        val seenPackages = HashSet<String>()
        val results = JSONArray()

        val sorted = resolveInfos.sortedBy {
            try {
                it.loadLabel(pm).toString().lowercase()
            } catch (_: Exception) {
                it.activityInfo?.packageName?.lowercase() ?: ""
            }
        }

        for (info in sorted) {
            val pkg = info.activityInfo?.packageName ?: continue
            if (pkg == context.packageName || seenPackages.contains(pkg)) continue
            seenPackages.add(pkg)

            val label = try {
                info.loadLabel(pm).toString().ifBlank { pkg }
            } catch (_: Exception) {
                pkg
            }
            val category = resolveCategory(pm, pkg)
            val iconBase64 = try {
                getOrEncodeIcon(pm, pkg, info.loadIcon(pm))
            } catch (_: Exception) {
                null
            }

            val obj = JSONObject().apply {
                put("id", pkg)
                put("name", label)
                put("packageName", pkg)
                put("category", category)
                if (iconBase64 != null) {
                    put("iconBase64", iconBase64)
                }
            }
            results.put(obj)
        }

        return results.toString()
    }

    @JavascriptInterface
    fun launchApp(packageName: String): Boolean {
        return try {
            val pm = context.packageManager
            val launchIntent = pm.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
                context.startActivity(launchIntent)
                return true
            }

            // Fallback: resolve explicit MAIN/LAUNCHER component for OEM apps
            val queryIntent = Intent(Intent.ACTION_MAIN, null).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
                `package` = packageName
            }
            val matches = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.queryIntentActivities(queryIntent, PackageManager.ResolveInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.queryIntentActivities(queryIntent, 0)
            }
            val activityInfo = matches.firstOrNull()?.activityInfo ?: return false
            val componentIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
                component = ComponentName(activityInfo.packageName, activityInfo.name)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
            }
            context.startActivity(componentIntent)
            true
        } catch (_: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun openAppInfo(packageName: String) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun uninstallApp(packageName: String) {
        try {
            val intent = Intent(Intent.ACTION_DELETE).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun isDefaultLauncher(): Boolean {
        val intent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
        }
        val resolveInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.packageManager.resolveActivity(
                intent,
                PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_DEFAULT_ONLY.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
        }
        return resolveInfo?.activityInfo?.packageName == context.packageName
    }

    @JavascriptInterface
    fun openHomeSettings() {
        if (!isDefaultLauncher() && activity.requestDefaultHomeRole()) {
            return
        }
        try {
            val intent = Intent(Settings.ACTION_HOME_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            try {
                val chooser = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(Intent.createChooser(chooser, "Select Home App"))
            } catch (_: Exception) {
            }
        }
    }

    @JavascriptInterface
    fun setSystemBarAppearance(isLight: Boolean) {
        activity.updateSystemBarAppearance(isLight)
    }

    @JavascriptInterface
    fun hasNotificationAccess(): Boolean {
        val enabledListeners = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        ) ?: return false
        val flat = ComponentName(context, SkyNotificationListenerService::class.java).flattenToString()
        return enabledListeners.contains(flat)
    }

    @JavascriptInterface
    fun openNotificationSettings() {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun getActiveNotifications(): String {
        if (!hasNotificationAccess()) return "[]"
        return SkyNotificationListenerService.getActiveSummariesJson()
    }

    @JavascriptInterface
    fun getDeviceStatus(): String {
        val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val level = bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
        val charging = bm?.isCharging ?: false

        return JSONObject().apply {
            put("batteryLevel", if (level in 0..100) level else JSONObject.NULL)
            put("isCharging", charging)
            put("sdkInt", Build.VERSION.SDK_INT)
        }.toString()
    }

    @JavascriptInterface
    fun openWifiSettings() {
        try {
            val intent = Intent(Settings.ACTION_WIFI_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun openBluetoothSettings() {
        try {
            val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun openDisplaySettings() {
        try {
            val intent = Intent(Settings.ACTION_DISPLAY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun openSoundSettings() {
        try {
            val intent = Intent(Settings.ACTION_SOUND_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
        }
    }

    @JavascriptInterface
    fun toggleFlashlight(): Boolean {
        return try {
            val cm = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager ?: return false
            val cameraId = cm.cameraIdList.firstOrNull() ?: return false
            torchEnabled = !torchEnabled
            cm.setTorchMode(cameraId, torchEnabled)
            torchEnabled
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveCategory(pm: PackageManager, packageName: String): String {
        return try {
            val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getApplicationInfo(packageName, 0)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                when (appInfo.category) {
                    ApplicationInfo.CATEGORY_GAME -> "Games"
                    ApplicationInfo.CATEGORY_AUDIO -> "Audio"
                    ApplicationInfo.CATEGORY_VIDEO -> "Video"
                    ApplicationInfo.CATEGORY_IMAGE -> "Media"
                    ApplicationInfo.CATEGORY_SOCIAL -> "Social"
                    ApplicationInfo.CATEGORY_NEWS -> "News"
                    ApplicationInfo.CATEGORY_MAPS -> "Navigation"
                    ApplicationInfo.CATEGORY_PRODUCTIVITY -> "Productivity"
                    else -> "Application"
                }
            } else {
                "Application"
            }
        } catch (_: Exception) {
            "Application"
        }
    }

    private fun getOrEncodeIcon(
        pm: PackageManager,
        packageName: String,
        drawable: Drawable?
    ): String? {
        iconCache.get(packageName)?.let { return it }
        val resolvedDrawable = drawable ?: try {
            pm.getApplicationIcon(packageName)
        } catch (_: Exception) {
            null
        } ?: return null

        return try {
            val size = 72
            val bitmap = if (resolvedDrawable is BitmapDrawable && resolvedDrawable.bitmap != null) {
                Bitmap.createScaledBitmap(resolvedDrawable.bitmap, size, size, true)
            } else {
                Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888).also { bmp ->
                    val canvas = Canvas(bmp)
                    resolvedDrawable.setBounds(0, 0, canvas.width, canvas.height)
                    resolvedDrawable.draw(canvas)
                }
            }
            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 85, stream)
            val encoded = "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
            iconCache.put(packageName, encoded)
            encoded
        } catch (_: Exception) {
            null
        }
    }
}
