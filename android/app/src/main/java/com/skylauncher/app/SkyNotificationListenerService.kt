package com.skylauncher.app

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class SkyNotificationListenerService : NotificationListenerService() {

    companion object {
        private val activeCounts = ConcurrentHashMap<String, NotificationRecord>()

        data class NotificationRecord(
            val count: Int,
            val title: String?,
            val text: String?,
            val timestamp: Long
        )

        fun getActiveSummariesJson(): String {
            val array = JSONArray()
            for ((pkg, record) in activeCounts) {
                val obj = JSONObject().apply {
                    put("packageName", pkg)
                    put("count", record.count)
                    put("latestTitle", record.title ?: "")
                    put("latestText", record.text ?: "")
                    put("timestamp", record.timestamp)
                }
                array.put(obj)
            }
            return array.toString()
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        rebuildCache()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        rebuildCache()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        rebuildCache()
    }

    private fun rebuildCache() {
        val list = try {
            activeNotifications ?: emptyArray()
        } catch (_: Exception) {
            emptyArray()
        }

        val grouped = HashMap<String, MutableList<StatusBarNotification>>()
        for (sbn in list) {
            if (sbn.isOngoing) continue
            grouped.getOrPut(sbn.packageName) { mutableListOf() }.add(sbn)
        }

        activeCounts.clear()
        for ((pkg, items) in grouped) {
            val latest = items.maxByOrNull { it.postTime }
            val extras = latest?.notification?.extras
            val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString()
            val text = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            activeCounts[pkg] = NotificationRecord(
                count = items.size,
                title = title,
                text = text,
                timestamp = latest?.postTime ?: System.currentTimeMillis()
            )
        }
    }
}
