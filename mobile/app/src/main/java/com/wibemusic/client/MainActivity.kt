package com.wibemusic.client

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Клиент WibeMusic: открывает веб-интерфейс сервера (Hub) внутри приложения.
 * Адрес сервера запоминается на устройстве; его можно сменить через кнопку «Сменить сервер».
 */
class MainActivity : AppCompatActivity() {

    private val prefs by lazy { getSharedPreferences("wibemusic", Context.MODE_PRIVATE) }
    private var webView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = prefs.getString(KEY_URL, null)
        if (url.isNullOrBlank()) showSetup() else showWeb(url)
    }

    override fun onBackPressed() {
        val view = webView
        if (view != null && view.canGoBack()) view.goBack() else super.onBackPressed()
    }

    private fun showSetup(error: String? = null) {
        webView = null
        val dp = resources.displayMetrics.density
        fun px(v: Int) = (v * dp).toInt()

        val input = EditText(this).apply {
            hint = "http://192.168.1.10:8080"
            setText(prefs.getString(KEY_URL, ""))
            setSingleLine(true)
            setTextColor(Color.WHITE)
            setHintTextColor(0xFF6E6E6E.toInt())
        }
        val status = TextView(this).apply {
            text = error ?: "Введите адрес сервера WibeMusic, например адрес вашего ПК в домашней сети или https://ваш-домен."
            setTextColor(if (error == null) 0xFFA8A8A8.toInt() else 0xFFF26B63.toInt())
            textSize = 14f
        }
        val button = Button(this).apply {
            text = "Подключиться"
            setTextColor(Color.BLACK)
            setBackgroundColor(0xFF2DD4BF.toInt())
            setOnClickListener {
                val value = normalize(input.text.toString())
                if (value == null) {
                    showSetup("Адрес должен начинаться с http:// или https://")
                } else {
                    prefs.edit().putString(KEY_URL, value).apply()
                    showWeb(value)
                }
            }
        }
        val title = TextView(this).apply {
            text = "WibeMusic"
            setTextColor(Color.WHITE)
            textSize = 28f
            gravity = Gravity.CENTER_HORIZONTAL
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF0B0B0B.toInt())
            setPadding(px(24), px(48), px(24), px(24))
            addView(title, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            addView(status, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = px(16) })
            addView(input, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = px(24) })
            addView(button, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = px(16) })
        }
        setContentView(root)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showWeb(url: String) {
        val view = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            setBackgroundColor(0xFF0B0B0B.toInt())
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) {
                        view.loadData(errorPage(), "text/html; charset=utf-8", "utf-8")
                    }
                }
            }
        }
        webView = view
        setContentView(view)
        view.loadUrl(url)
    }

    private fun errorPage(): String = """
        <html><body style="background:#0b0b0b;color:#f2f2f2;font-family:sans-serif;padding:24px">
        <h2>Нет связи с сервером</h2>
        <p style="color:#a8a8a8">Проверьте, что сервер WibeMusic запущен и доступен с этого устройства.</p>
        </body></html>
    """.trimIndent()

    private fun normalize(raw: String): String? {
        val value = raw.trim().trimEnd('/')
        return if (value.startsWith("http://") || value.startsWith("https://")) value else null
    }

    companion object {
        private const val KEY_URL = "server_url"
    }
}
