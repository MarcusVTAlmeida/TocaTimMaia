package com.queniabr.TocaTimMaia

import android.app.Application
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {}

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    criarCanalNotificacao()
  }

  private fun criarCanalNotificacao() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val soundUri = try {
        val id = resources.getIdentifier("notificacao_evento", "raw", packageName)
        if (id > 0) {
          Uri.parse("android.resource://$packageName/$id")
        } else {
          android.provider.Settings.System.DEFAULT_NOTIFICATION_URI
        }
      } catch (_: Exception) {
        android.provider.Settings.System.DEFAULT_NOTIFICATION_URI
      }

      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

      val channel = NotificationChannel(
        "eventos2",
        "Eventos",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificações de shows e eventos próximos"
        setShowBadge(true)
        enableLights(true)
        lightColor = 0xFFC9A84C.toInt()
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
        lockscreenVisibility = Notification.VISIBILITY_PRIVATE
        setSound(soundUri, attrs)
      }

      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }
}
