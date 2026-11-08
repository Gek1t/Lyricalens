package com.lyricalens.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Color;
import android.hardware.display.DisplayManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Display;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.DisplayCutoutCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private volatile int detectedRefreshRate = 60;
    private volatile int lastSafeTopDp = 48;
    private volatile int lastInjectedFps = -1;
    private volatile int lastInjectedTopDp = -1;
    private boolean isWebViewConfigured = false;
    private HighFpsKeepAliveView keepAliveView = null;
    private DisplayManager.DisplayListener displayListener = null;
    private AndroidNativeMediaBridge nativeMediaBridge = null;

    // Session-level QR auth caches so if a background poll receives 803 while user is inside NetEase/QQ App,
    // returning to Lyricalens immediately resolves with 803 + full cookie + profile
    private static volatile String lastCapturedNcmKey = "";
    private static volatile int lastCapturedNcmKeyType = 3;
    private static volatile String lastCapturedNcmCookie = "";
    private static volatile String lastCapturedNcmResultJson = "";
    private static volatile String latestNcmKeyJson = "";
    private static volatile String latestNcmPollJson = "{\"success\":true,\"code\":801,\"message\":\"等待扫码中...\"}";
    private static volatile boolean ncmCheckInFlight = false;

    private static volatile String lastCapturedQqSig = "";
    private static volatile String lastCapturedQqResultJson = "";
    private static volatile String latestQqKeyJson = "";
    private static volatile String latestQqPollJson = "{\"success\":true,\"code\":801,\"message\":\"等待手机 QQ 扫码中...\"}";
    private static volatile boolean qqCheckInFlight = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        // 1. Edge-to-edge immersive display & transparent system bars
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // 2. Punch hole / Cutout display adaptation (shortEdges extends canvas under camera punch hole)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = window.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(lp);
        }

        // 3. Unlock 90Hz / 120Hz / 144Hz native display refresh rate matching active physical resolution
        applyHighRefreshRateMode(false);
        registerDynamicDisplayListener();

        // 4. Accurately measure punch-hole / cutout depth and inject CSS safe-area & refresh rate variables
        ViewCompat.setOnApplyWindowInsetsListener(window.getDecorView(), (v, windowInsets) -> {
            int topInsetPx = 0;
            DisplayCutoutCompat cutout = windowInsets.getDisplayCutout();
            if (cutout != null) {
                topInsetPx = Math.max(topInsetPx, cutout.getSafeInsetTop());
            }
            Insets barInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
            );
            topInsetPx = Math.max(topInsetPx, barInsets.top);

            float density = getResources().getDisplayMetrics().density;
            int computedTopDp = Math.max((int) (topInsetPx / density), 48);
            if (computedTopDp != lastSafeTopDp) {
                lastSafeTopDp = computedTopDp;
                injectMetricsToWebView(false);
            }
            return windowInsets;
        });

        // 5. Hardware acceleration, external scheme handling & WebView optimizations
        installHighFpsKeepAlivePulse();
        setupWebViewAndBridge();
        window.getDecorView().post(this::setupWebViewAndBridge);
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev != null) {
            int action = ev.getActionMasked();
            if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_MOVE) {
                triggerKeepAliveBoost(2600);
            } else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
                triggerKeepAliveBoost(1600);
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyHighRefreshRateMode(false);
        triggerKeepAliveBoost(2000);
        notifyWebViewAppResumed();
    }

    @Override
    public void onPause() {
        if (keepAliveView != null) {
            keepAliveView.stopBoost();
        }
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyHighRefreshRateMode(false);
            triggerKeepAliveBoost(1600);
            notifyWebViewAppResumed();
        } else if (keepAliveView != null) {
            keepAliveView.stopBoost();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyHighRefreshRateMode(false);
    }

    @Override
    public void onDestroy() {
        if (displayListener != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            try {
                DisplayManager dm = (DisplayManager) getSystemService(Context.DISPLAY_SERVICE);
                if (dm != null) {
                    dm.unregisterDisplayListener(displayListener);
                }
            } catch (Exception ignored) {}
            displayListener = null;
        }
        super.onDestroy();
    }

    private void installHighFpsKeepAlivePulse() {
        try {
            ViewGroup content = findViewById(android.R.id.content);
            if (content != null && keepAliveView == null) {
                keepAliveView = new HighFpsKeepAliveView(this);
                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(1, 1, Gravity.TOP | Gravity.START);
                keepAliveView.setLayoutParams(params);
                keepAliveView.setClickable(false);
                keepAliveView.setFocusable(false);
                keepAliveView.setAlpha(0.004f);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    keepAliveView.setZ(-100f);
                }
                content.addView(keepAliveView);
            }
        } catch (Exception ignored) {}
    }

    public void triggerKeepAliveBoost(long durationMs) {
        if (keepAliveView != null) {
            keepAliveView.triggerBoost(durationMs);
        }
    }

    private void notifyWebViewAppResumed() {
        // Trigger immediate background QR check on native executor when returning from NetEase / QQ Music App
        if (nativeMediaBridge != null) {
            nativeMediaBridge.onAppResumed();
        }
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView == null) return;
            webView.post(() -> {
                try {
                    webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('lyricalens:native-resume'));",
                        null
                    );
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    public void dispatchQrEventToWebView(final String eventName, final String jsonPayload) {
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView == null || jsonPayload == null) return;
            webView.post(() -> {
                try {
                    webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('" + eventName + "', { detail: " + jsonPayload + " }));",
                        null
                    );
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    private void registerDynamicDisplayListener() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR1 || displayListener != null) {
            return;
        }
        try {
            DisplayManager dm = (DisplayManager) getSystemService(Context.DISPLAY_SERVICE);
            if (dm != null) {
                displayListener = new DisplayManager.DisplayListener() {
                    @Override
                    public void onDisplayAdded(int displayId) {}

                    @Override
                    public void onDisplayRemoved(int displayId) {}

                    @Override
                    public void onDisplayChanged(int displayId) {
                        applyHighRefreshRateMode(false);
                    }
                };
                dm.registerDisplayListener(displayListener, new Handler(Looper.getMainLooper()));
            }
        } catch (Exception ignored) {}
    }

    private void injectMetricsToWebView(boolean force) {
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView == null) return;
            final int fps = detectedRefreshRate;
            final int topDp = lastSafeTopDp;
            if (!force && fps == lastInjectedFps && topDp == lastInjectedTopDp) {
                return;
            }
            lastInjectedFps = fps;
            lastInjectedTopDp = topDp;
            final String budgetMs = String.format(Locale.US, "%.2fms", 1000.0f / Math.max(60, fps));
            webView.post(() -> {
                try {
                    webView.evaluateJavascript(
                        "window.__DEVICE_REFRESH_RATE__ = " + fps + ";" +
                        "if (window.document && window.document.documentElement) {" +
                        "  var r = window.document.documentElement;" +
                        "  if (r.style.getPropertyValue('--android-safe-top') !== '" + topDp + "px') r.style.setProperty('--android-safe-top', '" + topDp + "px');" +
                        "  if (r.style.getPropertyValue('--device-fps') !== '" + fps + "') r.style.setProperty('--device-fps', '" + fps + "');" +
                        "  if (r.style.getPropertyValue('--frame-budget-ms') !== '" + budgetMs + "') r.style.setProperty('--frame-budget-ms', '" + budgetMs + "');" +
                        "  if (r.dataset.refreshRate !== '" + fps + "') r.dataset.refreshRate = '" + fps + "';" +
                        "}",
                        null
                    );
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    private void applyHighRefreshRateMode(boolean forceInject) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }
        try {
            Window window = getWindow();
            if (window == null) return;

            // Android 14/15 (API 34+): disable frame rate power-saving throttling on WebView window
            if (Build.VERSION.SDK_INT >= 34) {
                try {
                    Method m = Window.class.getMethod("setFrameRatePowerSavingsBalanced", boolean.class);
                    m.invoke(window, false);
                } catch (Exception ignored) {}
            }

            Display display = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                display = getDisplay();
            }
            if (display == null) {
                display = window.getWindowManager().getDefaultDisplay();
            }
            if (display == null) return;

            Display.Mode activeMode = display.getMode();
            Display.Mode[] modes = display.getSupportedModes();
            Display.Mode bestSameResMode = null;
            float maxSameResRate = 0.0f;
            float maxOverallRate = activeMode != null ? activeMode.getRefreshRate() : 60.0f;

            for (Display.Mode mode : modes) {
                float rate = mode.getRefreshRate();
                if (activeMode != null &&
                    mode.getPhysicalWidth() == activeMode.getPhysicalWidth() &&
                    mode.getPhysicalHeight() == activeMode.getPhysicalHeight()) {
                    if (rate > maxSameResRate) {
                        maxSameResRate = rate;
                        bestSameResMode = mode;
                    }
                }
                if (rate > maxOverallRate) {
                    maxOverallRate = rate;
                }
            }

            // Strictly lock preferredDisplayModeId within the active physical resolution to avoid black-screen resolution switches
            float targetRate = maxSameResRate > 0.0f ? maxSameResRate : maxOverallRate;
            float preferredRateHint = Math.max(targetRate, maxOverallRate);

            WindowManager.LayoutParams lp = window.getAttributes();
            boolean changed = false;
            if (bestSameResMode != null && lp.preferredDisplayModeId != bestSameResMode.getModeId()) {
                lp.preferredDisplayModeId = bestSameResMode.getModeId();
                changed = true;
            }
            if (Math.abs(lp.preferredRefreshRate - preferredRateHint) > 0.5f) {
                lp.preferredRefreshRate = preferredRateHint;
                changed = true;
            }
            if (changed) {
                window.setAttributes(lp);
            }

            int roundedFps = Math.round(targetRate);
            int nextDetected;
            if (roundedFps >= 132) {
                nextDetected = 144;
            } else if (roundedFps >= 105) {
                nextDetected = 120;
            } else if (roundedFps >= 75) {
                nextDetected = 90;
            } else {
                nextDetected = 60;
            }

            boolean fpsChanged = (nextDetected != detectedRefreshRate);
            detectedRefreshRate = nextDetected;

            if (changed || fpsChanged || forceInject) {
                applyRequestedFrameRateOnViews(preferredRateHint);
                injectMetricsToWebView(forceInject);
            }
        } catch (Exception e) {
            // Ignore fallback
        }
    }

    private void applyRequestedFrameRateOnViews(float targetFrameRate) {
        try {
            Window window = getWindow();
            View decorView = window != null ? window.getDecorView() : null;
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;

            // Android 14+ (API 34+): View.setRequestedFrameRate(float) explicit high-refresh vote for HyperOS/ColorOS/OriginOS
            if (Build.VERSION.SDK_INT >= 34) {
                try {
                    Method setReqRate = View.class.getMethod("setRequestedFrameRate", float.class);
                    if (decorView != null) setReqRate.invoke(decorView, targetFrameRate);
                    if (webView != null) setReqRate.invoke(webView, targetFrameRate);
                } catch (Exception ignored) {}
            }

            // Android 11+ (API 30+): if any child SurfaceView exists inside WebView hierarchy, vote high frame rate on its Surface
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && decorView instanceof ViewGroup) {
                applySurfaceViewFrameRateRecursive((ViewGroup) decorView, targetFrameRate);
            }
        } catch (Exception ignored) {}
    }

    private void applySurfaceViewFrameRateRecursive(ViewGroup group, float targetFrameRate) {
        if (group == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        int count = group.getChildCount();
        for (int i = 0; i < count; i++) {
            View child = group.getChildAt(i);
            if (child instanceof SurfaceView) {
                try {
                    Surface surface = ((SurfaceView) child).getHolder().getSurface();
                    if (surface != null && surface.isValid()) {
                        surface.setFrameRate(targetFrameRate, Surface.FRAME_RATE_COMPATIBILITY_DEFAULT);
                    }
                } catch (Exception ignored) {}
            } else if (child instanceof ViewGroup) {
                applySurfaceViewFrameRateRecursive((ViewGroup) child, targetFrameRate);
            }
        }
    }

    public int getDetectedRefreshRate() {
        return detectedRefreshRate;
    }

    public int getLastSafeTopDp() {
        return lastSafeTopDp;
    }

    private void setupWebViewAndBridge() {
        if (isWebViewConfigured) {
            return;
        }
        try {
            Bridge bridge = getBridge();
            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView != null && bridge != null) {
                isWebViewConfigured = true;
                // Crucial: Use LAYER_TYPE_NONE on WebView inside hardware-accelerated Window so Chromium tiles
                // composite directly into the Window RenderNode without a redundant full-screen offscreen FBO copy!
                webView.setLayerType(View.LAYER_TYPE_NONE, null);
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                applyRequestedFrameRateOnViews((float) detectedRefreshRate);
                WebSettings webSettings = webView.getSettings();
                webSettings.setDomStorageEnabled(true);
                webSettings.setDatabaseEnabled(true);
                
                // Enable Cookies & Third-party cookies for seamless auth
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    cookieManager.setAcceptThirdPartyCookies(webView, true);
                }

                // Register Native MediaStore Image Saver & Direct Auth Bridge
                nativeMediaBridge = new AndroidNativeMediaBridge(MainActivity.this);
                webView.addJavascriptInterface(nativeMediaBridge, "AndroidNativeMedia");

                // Register custom BridgeWebViewClient to reliably intercept external schemes and replay DOM metrics after navigation commit
                bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public void onPageCommitVisible(WebView view, String url) {
                        super.onPageCommitVisible(view, url);
                        injectMetricsToWebView(true);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        injectMetricsToWebView(true);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            Uri reqUri = request.getUrl();
                            if (isExternalScheme(reqUri)) {
                                handleExternalUri(reqUri);
                                return true;
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        if (url != null && !url.trim().isEmpty()) {
                            Uri parsedUri = Uri.parse(url);
                            if (isExternalScheme(parsedUri)) {
                                handleExternalUri(parsedUri);
                                return true;
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, url);
                    }
                });

                injectMetricsToWebView(true);
            }
        } catch (Exception e) {
            // Ignore
        }
    }

    private boolean isExternalScheme(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (scheme == null) return false;
        String schemeLower = scheme.toLowerCase();
        return !schemeLower.equals("http") && !schemeLower.equals("https") &&
               !schemeLower.equals("about") && !schemeLower.equals("data") &&
               !schemeLower.equals("blob") && !schemeLower.equals("capacitor") &&
               !schemeLower.equals("chrome") && !schemeLower.equals("file");
    }

    public boolean handleExternalUri(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (scheme == null) return false;
        String schemeLower = scheme.toLowerCase();

        if (!isExternalScheme(uri)) {
            return false;
        }

        try {
            Intent intent;
            if (schemeLower.equals("intent")) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            intent.setComponent(null);
            intent.setSelector(null);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // 1. Direct scheme launch attempt
            try {
                startActivity(intent);
                return true;
            } catch (Exception directEx) {
                // Proceed to platform-specific fallbacks
            }

            // 2. Fallbacks for Mobile QQ / TIM
            if (schemeLower.startsWith("mqq") || schemeLower.equals("wtloginmqq") || schemeLower.equals("tim")) {
                try {
                    Intent qqExplicitIntent = new Intent(Intent.ACTION_VIEW, uri);
                    qqExplicitIntent.setPackage("com.tencent.mobileqq");
                    qqExplicitIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                    qqExplicitIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(qqExplicitIntent);
                    return true;
                } catch (Exception ignored) {}

                try {
                    String uriStr = uri.toString();
                    String altUriStr = uriStr.contains("scan_qr")
                        ? "mqqapi://qrcode/scan_qrcode?version=1&src_type=app"
                        : "mqqapi://qrcode/scan_qr";
                    Intent altIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(altUriStr));
                    altIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                    altIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(altIntent);
                    return true;
                } catch (Exception ignored) {}

                try {
                    Intent qqIntent = getPackageManager().getLaunchIntentForPackage("com.tencent.mobileqq");
                    if (qqIntent != null) {
                        qqIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(qqIntent);
                        return true;
                    }
                } catch (Exception ignored) {}

                try {
                    Intent timIntent = getPackageManager().getLaunchIntentForPackage("com.tencent.tim");
                    if (timIntent != null) {
                        timIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(timIntent);
                        return true;
                    }
                } catch (Exception ignored) {}

                try {
                    Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("mqq://"));
                    fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(fallbackIntent);
                    return true;
                } catch (Exception ignored) {}
            } else if (schemeLower.equals("qqmusic")) {
                try {
                    Intent qqmIntent = getPackageManager().getLaunchIntentForPackage("com.tencent.qqmusic");
                    if (qqmIntent != null) {
                        qqmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(qqmIntent);
                        return true;
                    }
                } catch (Exception ignored) {}
            } else if (schemeLower.startsWith("orpheus")) {
                try {
                    Intent ncmIntent = getPackageManager().getLaunchIntentForPackage("com.netease.cloudmusic");
                    if (ncmIntent != null) {
                        ncmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(ncmIntent);
                        return true;
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return false;
    }

    // Helper: NetEase EAPI AES-128-ECB + MD5 Encryption (identical to NeteaseCloudMusicApi util/crypto.js)
    private static String encryptNetEaseEapi(String uri, String jsonText) throws Exception {
        String message = "nobody" + uri + "use" + jsonText + "md5forencrypt";
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] mdBytes = md.digest(message.getBytes(StandardCharsets.UTF_8));
        StringBuilder digestHex = new StringBuilder(32);
        for (byte b : mdBytes) {
            digestHex.append(String.format("%02x", b & 0xff));
        }
        String plain = uri + "-36cd479b6b5-" + jsonText + "-36cd479b6b5-" + digestHex.toString();
        SecretKeySpec keySpec = new SecretKeySpec("e82ckenh8dichen8".getBytes(StandardCharsets.UTF_8), "AES");
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
        StringBuilder outHex = new StringBuilder(encrypted.length * 2);
        for (byte b : encrypted) {
            outHex.append(String.format("%02X", b & 0xff));
        }
        return outHex.toString();
    }

    private static JSONObject buildNetEaseEapiHeader() {
        JSONObject header = new JSONObject();
        try {
            long now = System.currentTimeMillis();
            header.put("osver", "Microsoft-Windows-10-Professional-build-19045-64bit");
            header.put("deviceId", "52B62F51D4D74D1F8928487EB01157B7");
            header.put("os", "pc");
            header.put("appver", "3.1.17.204416");
            header.put("versioncode", "140");
            header.put("mobilename", "");
            header.put("buildver", String.valueOf(now / 1000L));
            header.put("resolution", "1920x1080");
            header.put("__csrf", "");
            header.put("channel", "netease");
            header.put("requestId", now + "_0258");
        } catch (Exception ignored) {}
        return header;
    }

    private static String buildNetEaseHeaderCookieString(JSONObject header) {
        StringBuilder sb = new StringBuilder();
        java.util.Iterator<String> keys = header.keys();
        while (keys.hasNext()) {
            String k = keys.next();
            String v = header.optString(k, "");
            if (sb.length() > 0) sb.append("; ");
            try {
                sb.append(URLEncoder.encode(k, "UTF-8")).append("=").append(URLEncoder.encode(v, "UTF-8"));
            } catch (Exception ignored) {}
        }
        return sb.toString();
    }

    private static String readConnectionBody(HttpURLConnection conn) throws Exception {
        InputStream in = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
        if (in == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    private static void extractSetCookiesFromConnection(HttpURLConnection conn, List<String> outCookies) {
        if (conn == null || outCookies == null) return;
        Map<String, List<String>> headers = conn.getHeaderFields();
        if (headers == null) return;
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            String key = entry.getKey();
            if (key != null && (key.equalsIgnoreCase("Set-Cookie") || key.equalsIgnoreCase("Set-Cookie2"))) {
                List<String> values = entry.getValue();
                if (values != null) {
                    outCookies.addAll(values);
                }
            }
        }
    }

    private static int calcQqPtQrToken(String qrsig) {
        int hash = 0;
        for (int i = 0; i < qrsig.length(); i++) {
            hash += (hash << 5) + qrsig.charAt(i);
        }
        return 2147483647 & hash;
    }

    private static class HighFpsKeepAliveView extends View {
        private volatile long activeUntilUptimeMs = 0L;
        private boolean isPulsing = false;
        private boolean togglePhase = false;

        public HighFpsKeepAliveView(Context context) {
            super(context);
        }

        public void triggerBoost(long durationMs) {
            long target = SystemClock.uptimeMillis() + Math.max(400L, Math.min(durationMs, 5000L));
            if (target > activeUntilUptimeMs) {
                activeUntilUptimeMs = target;
            }
            if (!isPulsing) {
                isPulsing = true;
                postInvalidateOnAnimation();
            }
        }

        public void stopBoost() {
            activeUntilUptimeMs = 0L;
            isPulsing = false;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            if (SystemClock.uptimeMillis() < activeUntilUptimeMs) {
                togglePhase = !togglePhase;
                setTranslationX(togglePhase ? 0.01f : 0.0f);
                postInvalidateOnAnimation();
            } else {
                isPulsing = false;
            }
        }
    }

    public static class AndroidNativeMediaBridge {
        private final Context context;
        private final ExecutorService qrExecutor = Executors.newSingleThreadExecutor();

        public AndroidNativeMediaBridge(Context context) {
            this.context = context;
        }

        public void onAppResumed() {
            final String activeNcmKey = lastCapturedNcmKey;
            if (activeNcmKey != null && !activeNcmKey.isEmpty() && lastCapturedNcmResultJson.isEmpty()) {
                triggerNetEaseQrCheckAsync(activeNcmKey, true);
            }
            final String activeQqSig = lastCapturedQqSig;
            if (activeQqSig != null && !activeQqSig.isEmpty() && lastCapturedQqResultJson.isEmpty()) {
                triggerQqQrCheckAsync(activeQqSig, true);
            }
        }

        private void emitQrEvent(String eventName, String jsonPayload) {
            if (context instanceof MainActivity) {
                ((MainActivity) context).dispatchQrEventToWebView(eventName, jsonPayload);
            }
        }

        @JavascriptInterface
        public boolean openAppScheme(String urlString) {
            if (urlString == null || urlString.trim().isEmpty()) {
                return false;
            }
            try {
                if (context instanceof MainActivity) {
                    return ((MainActivity) context).handleExternalUri(Uri.parse(urlString));
                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlString));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public boolean launchApp(String urlString) {
            return openAppScheme(urlString);
        }

        @JavascriptInterface
        public boolean saveImageToGallery(String base64Data, String filename) {
            try {
                if (base64Data == null || base64Data.trim().isEmpty()) {
                    return false;
                }
                String cleanBase64 = base64Data;
                int commaIdx = cleanBase64.indexOf(",");
                if (commaIdx >= 0) {
                    cleanBase64 = cleanBase64.substring(commaIdx + 1);
                }
                byte[] imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                if (imageBytes == null || imageBytes.length == 0) {
                    return false;
                }

                String name = (filename != null && !filename.trim().isEmpty())
                    ? filename.trim()
                    : ("netease_auth_qr_" + System.currentTimeMillis() + ".png");
                if (!name.endsWith(".png") && !name.endsWith(".jpg")) {
                    name += ".png";
                }

                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/LyricaLens");
                    values.put(MediaStore.Images.Media.IS_PENDING, 1);
                }

                Uri uri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (OutputStream out = context.getContentResolver().openOutputStream(uri)) {
                        if (out != null) {
                            out.write(imageBytes);
                            out.flush();
                        }
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        values.clear();
                        values.put(MediaStore.Images.Media.IS_PENDING, 0);
                        context.getContentResolver().update(uri, values, null, null);
                    } else {
                        context.sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, uri));
                    }
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }

        @JavascriptInterface
        public String getCookiesForUrl(String url) {
            try {
                if (url == null || url.trim().isEmpty()) {
                    return "";
                }
                StringBuilder sb = new StringBuilder();
                String c1 = CookieManager.getInstance().getCookie(url);
                if (c1 != null && !c1.isEmpty()) sb.append(c1);
                if (url.contains("163.com")) {
                    String c2 = CookieManager.getInstance().getCookie("https://interface.music.163.com");
                    if (c2 != null && !c2.isEmpty()) {
                        if (sb.length() > 0) sb.append("; ");
                        sb.append(c2);
                    }
                    String c3 = CookieManager.getInstance().getCookie("https://localhost");
                    if (c3 != null && c3.contains("MUSIC_U=")) {
                        if (sb.length() > 0) sb.append("; ");
                        sb.append(c3);
                    }
                    if (!lastCapturedNcmCookie.isEmpty()) {
                        if (sb.length() > 0) sb.append("; ");
                        sb.append(lastCapturedNcmCookie);
                    }
                }
                return sb.toString();
            } catch (Exception e) {
                return "";
            }
        }

        /**
         * Non-blocking Native NetEase Cloud Music EAPI QR Unikey Generator
         * Runs HTTP I/O on background qrExecutor and emits 'lyricalens:native-ncm-key' to WebView
         */
        @JavascriptInterface
        public String nativeNetEaseQrKey() {
            lastCapturedNcmKey = "";
            lastCapturedNcmKeyType = 3;
            lastCapturedNcmCookie = "";
            lastCapturedNcmResultJson = "";
            latestNcmKeyJson = "";
            latestNcmPollJson = "{\"success\":true,\"code\":801,\"message\":\"等待扫码中...\"}";

            qrExecutor.execute(() -> {
                String resJson = performNetEaseQrKeySync();
                latestNcmKeyJson = resJson;
                emitQrEvent("lyricalens:native-ncm-key", resJson);
            });
            return "{\"success\":true,\"pending\":true}";
        }

        private String performNetEaseQrKeySync() {
            try {
                // Clear any stale MUSIC_U and __csrf across all domain scopes so a fresh scan is cleanly detected
                try {
                    CookieManager cm = CookieManager.getInstance();
                    String[] urls = new String[]{"https://music.163.com", "https://interface.music.163.com", "https://localhost"};
                    String[] domains = new String[]{"", "; Domain=music.163.com", "; Domain=.163.com"};
                    for (String u : urls) {
                        for (String d : domains) {
                            cm.setCookie(u, "MUSIC_U=; Expires=Wed, 31 Dec 2000 23:59:59 GMT; Path=/" + d);
                            cm.setCookie(u, "__csrf=; Expires=Wed, 31 Dec 2000 23:59:59 GMT; Path=/" + d);
                        }
                    }
                } catch (Exception ignored) {}

                JSONObject header = buildNetEaseEapiHeader();
                JSONObject payload = new JSONObject();
                payload.put("type", 3);
                payload.put("header", header);
                payload.put("e_r", false);

                String paramsHex = encryptNetEaseEapi("/api/login/qrcode/unikey", payload.toString());
                String bodyStr = "params=" + URLEncoder.encode(paramsHex, "UTF-8");

                URL url = new URL("https://interface.music.163.com/eapi/login/qrcode/unikey");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setUseCaches(false);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                conn.setRequestProperty("Referer", "https://music.163.com/");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/3.0.18.203152");
                conn.setRequestProperty("Cookie", buildNetEaseHeaderCookieString(header));

                try (DataOutputStream os = new DataOutputStream(conn.getOutputStream())) {
                    os.write(bodyStr.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                String respText = readConnectionBody(conn);
                conn.disconnect();

                JSONObject respJson = new JSONObject(respText);
                String unikey = respJson.optString("unikey", "");
                if (!unikey.isEmpty()) {
                    lastCapturedNcmKey = unikey;
                    lastCapturedNcmKeyType = 3;
                    JSONObject out = new JSONObject();
                    out.put("success", true);
                    out.put("unikey", unikey);
                    out.put("qrurl", "https://music.163.com/login?codekey=" + URLEncoder.encode(unikey, "UTF-8"));
                    return out.toString();
                }
            } catch (Exception ignored) {}

            // Fallback to web api (type=1)
            try {
                URL url = new URL("https://music.163.com/api/login/qrcode/unikey?type=1&_t=" + System.currentTimeMillis());
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setUseCaches(false);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                conn.setRequestProperty("Referer", "https://music.163.com/");
                try (DataOutputStream os = new DataOutputStream(conn.getOutputStream())) {
                    os.write("type=1".getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }
                String respText = readConnectionBody(conn);
                conn.disconnect();
                JSONObject respJson = new JSONObject(respText);
                String unikey = respJson.optString("unikey", "");
                if (!unikey.isEmpty()) {
                    lastCapturedNcmKey = unikey;
                    lastCapturedNcmKeyType = 1;
                    JSONObject out = new JSONObject();
                    out.put("success", true);
                    out.put("unikey", unikey);
                    out.put("qrurl", "https://music.163.com/login?codekey=" + URLEncoder.encode(unikey, "UTF-8"));
                    return out.toString();
                }
            } catch (Exception ignored) {}

            return "{\"success\":false}";
        }

        /**
         * Non-blocking Native NetEase Cloud Music EAPI QR Status Checker
         * Never stalls V8 main thread: returns cached state immediately and triggers single-flight background check
         */
        @JavascriptInterface
        public String nativeNetEaseQrCheck(String key) {
            if (key == null || key.trim().isEmpty()) {
                return "{\"success\":false,\"code\":801,\"message\":\"等待扫码\"}";
            }
            String cleanKey = key.trim();

            if (cleanKey.equals(lastCapturedNcmKey) && !lastCapturedNcmResultJson.isEmpty()) {
                return lastCapturedNcmResultJson;
            }

            triggerNetEaseQrCheckAsync(cleanKey, false);
            return latestNcmPollJson;
        }

        public void triggerNetEaseQrCheckAsync(final String cleanKey, boolean force) {
            if (ncmCheckInFlight && !force) {
                return;
            }
            ncmCheckInFlight = true;
            qrExecutor.execute(() -> {
                try {
                    String resJson = performNetEaseQrCheckSync(cleanKey);
                    latestNcmPollJson = resJson;
                    emitQrEvent("lyricalens:native-qr-status", resJson);
                } finally {
                    ncmCheckInFlight = false;
                }
            });
        }

        private String performNetEaseQrCheckSync(String cleanKey) {
            if (cleanKey.equals(lastCapturedNcmKey) && !lastCapturedNcmResultJson.isEmpty()) {
                return lastCapturedNcmResultJson;
            }

            try {
                List<String> rawCookieSources = new java.util.ArrayList<>();
                int code = 801;
                String message = "";

                if (lastCapturedNcmKeyType == 3) {
                    JSONObject header = buildNetEaseEapiHeader();
                    JSONObject payload = new JSONObject();
                    payload.put("key", cleanKey);
                    payload.put("type", 3);
                    payload.put("header", header);
                    payload.put("e_r", false);

                    String paramsHex = encryptNetEaseEapi("/api/login/qrcode/client/login", payload.toString());
                    String bodyStr = "params=" + URLEncoder.encode(paramsHex, "UTF-8");

                    URL url = new URL("https://interface.music.163.com/eapi/login/qrcode/client/login");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    conn.setUseCaches(false);
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    conn.setRequestProperty("Referer", "https://music.163.com/");
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/3.0.18.203152");
                    conn.setRequestProperty("Cookie", buildNetEaseHeaderCookieString(header));

                    try (DataOutputStream os = new DataOutputStream(conn.getOutputStream())) {
                        os.write(bodyStr.getBytes(StandardCharsets.UTF_8));
                        os.flush();
                    }

                    extractSetCookiesFromConnection(conn, rawCookieSources);
                    String respText = readConnectionBody(conn);
                    conn.disconnect();

                    JSONObject respJson = new JSONObject(respText);
                    code = respJson.optInt("code", 801);
                    message = respJson.optString("message", "");
                    String bodyCookie = respJson.optString("cookie", "");
                    if (bodyCookie != null && !bodyCookie.isEmpty()) {
                        rawCookieSources.add(bodyCookie);
                    }
                } else {
                    URL wUrl = new URL("https://music.163.com/api/login/qrcode/client/login?_t=" + System.currentTimeMillis());
                    HttpURLConnection wConn = (HttpURLConnection) wUrl.openConnection();
                    wConn.setRequestMethod("POST");
                    wConn.setConnectTimeout(5000);
                    wConn.setReadTimeout(5000);
                    wConn.setUseCaches(false);
                    wConn.setDoOutput(true);
                    wConn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                    wConn.setRequestProperty("Referer", "https://music.163.com/");
                    wConn.setRequestProperty("Cookie", "os=pc; appver=3.1.17.204416; __remember_me=true");
                    String wBody = "key=" + URLEncoder.encode(cleanKey, "UTF-8") + "&type=1";
                    try (DataOutputStream os = new DataOutputStream(wConn.getOutputStream())) {
                        os.write(wBody.getBytes(StandardCharsets.UTF_8));
                        os.flush();
                    }
                    extractSetCookiesFromConnection(wConn, rawCookieSources);
                    String wResp = readConnectionBody(wConn);
                    wConn.disconnect();
                    JSONObject wJson = new JSONObject(wResp);
                    code = wJson.optInt("code", 801);
                    message = wJson.optString("message", "");
                    String wBodyCookie = wJson.optString("cookie", "");
                    if (wBodyCookie != null && !wBodyCookie.isEmpty()) {
                        rawCookieSources.add(wBodyCookie);
                    }
                }

                String musicU = "";
                String csrf = "";
                Pattern muPattern = Pattern.compile("MUSIC_U=([^;,\\s]+)");
                Pattern csrfPattern = Pattern.compile("__csrf=([^;,\\s]+)");

                for (String sc : rawCookieSources) {
                    Matcher m1 = muPattern.matcher(sc);
                    if (m1.find()) musicU = m1.group(1);
                    Matcher m2 = csrfPattern.matcher(sc);
                    if (m2.find()) csrf = m2.group(1);
                }

                // If current response explicitly delivered a fresh MUSIC_U cookie, mark code = 803
                if (!musicU.isEmpty()) {
                    code = 803;
                } else if (code == 803) {
                    // Only consult CookieManager or alternate type channel when server returned 803 without header/body MUSIC_U
                    try {
                        int altType = (lastCapturedNcmKeyType == 3) ? 1 : 3;
                        URL altUrl = new URL("https://music.163.com/api/login/qrcode/client/login?_t=" + System.currentTimeMillis());
                        HttpURLConnection altConn = (HttpURLConnection) altUrl.openConnection();
                        altConn.setRequestMethod("POST");
                        altConn.setConnectTimeout(4000);
                        altConn.setReadTimeout(4000);
                        altConn.setUseCaches(false);
                        altConn.setDoOutput(true);
                        altConn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                        altConn.setRequestProperty("Referer", "https://music.163.com/");
                        altConn.setRequestProperty("Cookie", "os=pc; appver=3.1.17.204416; __remember_me=true");
                        String altBody = "key=" + URLEncoder.encode(cleanKey, "UTF-8") + "&type=" + altType;
                        try (DataOutputStream os = new DataOutputStream(altConn.getOutputStream())) {
                            os.write(altBody.getBytes(StandardCharsets.UTF_8));
                            os.flush();
                        }
                        extractSetCookiesFromConnection(altConn, rawCookieSources);
                        String altResp = readConnectionBody(altConn);
                        altConn.disconnect();
                        JSONObject altJson = new JSONObject(altResp);
                        String altCookie = altJson.optString("cookie", "");
                        if (altCookie != null && !altCookie.isEmpty()) rawCookieSources.add(altCookie);
                        for (String sc : rawCookieSources) {
                            Matcher m1 = muPattern.matcher(sc);
                            if (m1.find()) musicU = m1.group(1);
                            Matcher m2 = csrfPattern.matcher(sc);
                            if (m2.find()) csrf = m2.group(1);
                        }
                    } catch (Exception ignored) {}

                    if (musicU.isEmpty()) {
                        String allCmCookies = getCookiesForUrl("https://music.163.com");
                        Matcher m1 = muPattern.matcher(allCmCookies);
                        if (m1.find()) musicU = m1.group(1);
                        Matcher m2 = csrfPattern.matcher(allCmCookies);
                        if (m2.find()) csrf = m2.group(1);
                    }
                }

                String finalCookie = "";
                if (!musicU.isEmpty()) {
                    finalCookie = "MUSIC_U=" + musicU + "; " + (csrf.isEmpty() ? "" : ("__csrf=" + csrf + "; ")) + "os=pc; appver=3.1.17.204416;";
                    lastCapturedNcmKey = cleanKey;
                    lastCapturedNcmCookie = finalCookie;
                    try {
                        CookieManager cm = CookieManager.getInstance();
                        cm.setCookie("https://music.163.com", "MUSIC_U=" + musicU + "; Path=/; Domain=.163.com");
                        if (!csrf.isEmpty()) {
                            cm.setCookie("https://music.163.com", "__csrf=" + csrf + "; Path=/; Domain=.163.com");
                        }
                    } catch (Exception ignored) {}
                }

                JSONObject out = new JSONObject();
                out.put("success", true);
                out.put("code", code);
                out.put("message", !message.isEmpty() ? message : (code == 803 ? "授权登录成功" : code == 802 ? "扫描成功，请在手机上点击确认" : "等待扫码"));
                out.put("cookie", finalCookie);

                // When authorized (803), fetch user's NetEase profile right here on qrExecutor so UI updates immediately
                if (code == 803 && !finalCookie.isEmpty()) {
                    try {
                        URL pUrl = new URL("https://music.163.com/api/nuser/account/get?_t=" + System.currentTimeMillis());
                        HttpURLConnection pConn = (HttpURLConnection) pUrl.openConnection();
                        pConn.setRequestMethod("POST");
                        pConn.setConnectTimeout(5000);
                        pConn.setReadTimeout(5000);
                        pConn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                        pConn.setRequestProperty("Referer", "https://music.163.com/");
                        pConn.setRequestProperty("Cookie", finalCookie);
                        String pText = readConnectionBody(pConn);
                        pConn.disconnect();
                        JSONObject pJson = new JSONObject(pText);
                        JSONObject profileObj = pJson.optJSONObject("profile");
                        if (profileObj != null) {
                            long uid = profileObj.optLong("userId", 0L);
                            if (uid > 0L) {
                                JSONObject cleanProfile = new JSONObject();
                                cleanProfile.put("userId", uid);
                                cleanProfile.put("nickname", profileObj.optString("nickname", "网易云VIP用户"));
                                cleanProfile.put("avatarUrl", profileObj.optString("avatarUrl", ""));
                                cleanProfile.put("vipType", profileObj.optInt("vipType", 1));
                                out.put("profile", cleanProfile);
                            }
                        }
                    } catch (Exception ignored) {}
                    lastCapturedNcmKey = cleanKey;
                    lastCapturedNcmResultJson = out.toString();
                }

                return out.toString();
            } catch (Exception e) {
                return "{\"success\":false,\"code\":801,\"message\":\"等待扫码中...\"}";
            }
        }

        /**
         * Non-blocking Native Tencent QQ Music Official QR Code Generator (ssl.ptlogin2.qq.com/ptqrshow)
         * Runs HTTP I/O on background qrExecutor and emits 'lyricalens:native-qq-key' to WebView
         */
        @JavascriptInterface
        public String nativeQqQrKey() {
            lastCapturedQqSig = "";
            lastCapturedQqResultJson = "";
            latestQqKeyJson = "";
            latestQqPollJson = "{\"success\":true,\"code\":801,\"message\":\"等待手机 QQ 扫码中...\"}";

            qrExecutor.execute(() -> {
                String resJson = performQqQrKeySync();
                latestQqKeyJson = resJson;
                emitQrEvent("lyricalens:native-qq-key", resJson);
            });
            return "{\"success\":true,\"pending\":true}";
        }

        private String performQqQrKeySync() {
            try {
                String ptqrShowUrl = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=716027609&e=2&l=M&s=3&d=72&v=4&t=" + Math.random() + "&daid=383&pt_3rd_aid=100497308";
                URL url = new URL(ptqrShowUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setUseCaches(false);
                conn.setRequestProperty("Referer", "https://xui.ptlogin2.qq.com/");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

                int respCode = conn.getResponseCode();
                List<String> rawCookies = new java.util.ArrayList<>();
                extractSetCookiesFromConnection(conn, rawCookies);

                String qrsig = "";
                Pattern sigPattern = Pattern.compile("qrsig=([^;,\\s]+)");
                for (String sc : rawCookies) {
                    Matcher m = sigPattern.matcher(sc);
                    if (m.find()) {
                        qrsig = m.group(1);
                        break;
                    }
                }

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                try (InputStream in = (respCode >= 400 ? conn.getErrorStream() : conn.getInputStream())) {
                    if (in != null) {
                        byte[] buf = new byte[2048];
                        int n;
                        while ((n = in.read(buf)) != -1) {
                            baos.write(buf, 0, n);
                        }
                    }
                }
                conn.disconnect();

                byte[] imgBytes = baos.toByteArray();
                if (!qrsig.isEmpty() && imgBytes.length > 100) {
                    lastCapturedQqSig = qrsig;
                    String base64Img = "data:image/png;base64," + Base64.encodeToString(imgBytes, Base64.NO_WRAP);
                    JSONObject out = new JSONObject();
                    out.put("success", true);
                    out.put("unikey", qrsig);
                    out.put("qrurl", ptqrShowUrl);
                    out.put("qrimg", base64Img);
                    return out.toString();
                }
            } catch (Exception ignored) {}
            return "{\"success\":false}";
        }

        /**
         * Non-blocking Native Tencent QQ Music Official QR Status Checker (ssl.ptlogin2.qq.com/ptqrlogin)
         * Never stalls V8 main thread: returns cached state immediately and triggers single-flight background check
         */
        @JavascriptInterface
        public String nativeQqQrCheck(String qrsig) {
            if (qrsig == null || qrsig.trim().isEmpty() || qrsig.startsWith("qq-")) {
                return "{\"success\":true,\"code\":801,\"message\":\"等待手机 QQ 扫码中...\"}";
            }
            String cleanSig = qrsig.trim();
            if (cleanSig.equals(lastCapturedQqSig) && !lastCapturedQqResultJson.isEmpty()) {
                return lastCapturedQqResultJson;
            }

            triggerQqQrCheckAsync(cleanSig, false);
            return latestQqPollJson;
        }

        public void triggerQqQrCheckAsync(final String cleanSig, boolean force) {
            if (qqCheckInFlight && !force) {
                return;
            }
            qqCheckInFlight = true;
            qrExecutor.execute(() -> {
                try {
                    String resJson = performQqQrCheckSync(cleanSig);
                    latestQqPollJson = resJson;
                    emitQrEvent("lyricalens:native-qr-status", resJson);
                } finally {
                    qqCheckInFlight = false;
                }
            });
        }

        private String performQqQrCheckSync(String cleanSig) {
            if (cleanSig.equals(lastCapturedQqSig) && !lastCapturedQqResultJson.isEmpty()) {
                return lastCapturedQqResultJson;
            }

            try {
                int ptqrtoken = calcQqPtQrToken(cleanSig);
                String checkUrl =
                    "https://ssl.ptlogin2.qq.com/ptqrlogin?u1=" + URLEncoder.encode("https://graph.qq.com/oauth2.0/login_jump", "UTF-8") +
                    "&ptqrtoken=" + ptqrtoken + "&ptredirect=0&h=1&t=1&g=1&from_ui=1&ptlang=2052" +
                    "&action=0-0-" + System.currentTimeMillis() + "&js_ver=22030810&js_type=1&login_sig=&pt_uistyle=40" +
                    "&aid=716027609&daid=383&pt_3rd_aid=100497308";

                URL url = new URL(checkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setUseCaches(false);
                conn.setRequestProperty("Referer", "https://xui.ptlogin2.qq.com/");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
                conn.setRequestProperty("Cookie", "qrsig=" + cleanSig + ";");

                conn.getResponseCode();
                List<String> rawSetCookies = new java.util.ArrayList<>();
                extractSetCookiesFromConnection(conn, rawSetCookies);
                String text = readConnectionBody(conn);
                conn.disconnect();

                Pattern cbPattern = Pattern.compile("ptuiCB\\(\\s*'([^']*)'\\s*,\\s*'([^']*)'\\s*,\\s*'([^']*)'\\s*,\\s*'([^']*)'\\s*,\\s*'([^']*)'\\s*,\\s*'([^']*)'");
                Matcher cbMatcher = cbPattern.matcher(text);
                if (!cbMatcher.find()) {
                    return "{\"success\":true,\"code\":801,\"message\":\"等待手机 QQ 扫码中...\"}";
                }

                String ptCode = cbMatcher.group(1);
                String redirectUrl = cbMatcher.group(3);
                String ptMessage = cbMatcher.group(5);
                String ptNickname = cbMatcher.group(6);

                if ("66".equals(ptCode)) {
                    return "{\"success\":true,\"code\":801,\"message\":\"等待手机 QQ / QQ 音乐扫一扫中...\"}";
                }
                if ("67".equals(ptCode)) {
                    return "{\"success\":true,\"code\":802,\"message\":\"扫描成功！请在手机上轻触「确认登录」\"}";
                }
                if ("65".equals(ptCode)) {
                    return "{\"success\":true,\"code\":800,\"message\":\"二维码已失效，请点击刷新\"}";
                }
                if ("0".equals(ptCode)) {
                    Map<String, String> cookieMap = new LinkedHashMap<>();
                    for (String c : rawSetCookies) {
                        String[] parts = c.split(";");
                        if (parts.length > 0) {
                            String pair = parts[0].trim();
                            int eqIdx = pair.indexOf('=');
                            if (eqIdx > 0 && !pair.endsWith("=")) {
                                cookieMap.put(pair.substring(0, eqIdx).trim(), pair);
                            }
                        }
                    }

                    String locationHeader = "";
                    if (redirectUrl != null && redirectUrl.startsWith("http")) {
                        try {
                            URL rUrl = new URL(redirectUrl);
                            HttpURLConnection rConn = (HttpURLConnection) rUrl.openConnection();
                            rConn.setInstanceFollowRedirects(false);
                            rConn.setConnectTimeout(5000);
                            rConn.setReadTimeout(5000);
                            rConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
                            StringBuilder ckSb = new StringBuilder();
                            for (String v : cookieMap.values()) {
                                if (ckSb.length() > 0) ckSb.append("; ");
                                ckSb.append(v);
                            }
                            rConn.setRequestProperty("Cookie", ckSb.toString());
                            // Explicitly trigger connection before extracting headers
                            rConn.getResponseCode();
                            locationHeader = rConn.getHeaderField("Location");
                            List<String> sigCookies = new java.util.ArrayList<>();
                            extractSetCookiesFromConnection(rConn, sigCookies);
                            rConn.disconnect();
                            for (String sc : sigCookies) {
                                String[] parts = sc.split(";");
                                if (parts.length > 0) {
                                    String pair = parts[0].trim();
                                    int eqIdx = pair.indexOf('=');
                                    if (eqIdx > 0 && !pair.endsWith("=")) {
                                        cookieMap.put(pair.substring(0, eqIdx).trim(), pair);
                                    }
                                }
                            }
                        } catch (Exception ignored) {}
                    }

                    StringBuilder mergedSb = new StringBuilder();
                    for (String v : cookieMap.values()) {
                        if (mergedSb.length() > 0) mergedSb.append("; ");
                        mergedSb.append(v);
                    }
                    String mergedCookieStr = mergedSb.toString();

                    String uin = "";
                    Pattern uinUrlPattern = Pattern.compile("[?&](?:uin|p_uin|pt2gguin|superuin|qqmusic_uin)=o?0*([1-9][0-9]{4,12})");
                    Pattern uinCookiePattern = Pattern.compile("(?:pt2gguin|p_uin|uin|superuin|ptui_loginuin|qqmusic_uin)=o?0*([1-9][0-9]{4,12})");

                    Matcher m1 = uinUrlPattern.matcher(redirectUrl != null ? redirectUrl : "");
                    if (m1.find()) {
                        uin = m1.group(1);
                    }
                    if (uin.isEmpty() && locationHeader != null) {
                        Matcher mLoc = uinUrlPattern.matcher(locationHeader);
                        if (mLoc.find()) uin = mLoc.group(1);
                    }
                    if (uin.isEmpty()) {
                        Matcher m2 = uinCookiePattern.matcher(mergedCookieStr);
                        if (m2.find()) uin = m2.group(1);
                    }

                    String finalCookie = !mergedCookieStr.isEmpty()
                        ? (uin.isEmpty() ? mergedCookieStr : (mergedCookieStr + "; uin=" + uin))
                        : (uin.isEmpty() ? "" : ("uin=" + uin));
                    String nickname = (ptNickname != null && !ptNickname.trim().isEmpty())
                        ? ptNickname.trim()
                        : (!uin.isEmpty() ? ("QQ音乐用户_" + uin.substring(Math.max(0, uin.length() - 4))) : "QQ音乐VIP用户");

                    JSONObject profile = new JSONObject();
                    if (!uin.isEmpty()) {
                        profile.put("userId", uin);
                        profile.put("avatarUrl", "https://q1.qlogo.cn/g?b=qq&nk=" + uin + "&s=100");
                    }
                    profile.put("nickname", nickname);
                    profile.put("vipType", 1);

                    JSONObject out = new JSONObject();
                    out.put("success", true);
                    out.put("code", 803);
                    out.put("message", "授权成功！已绑定 QQ 音乐账号");
                    out.put("cookie", finalCookie);
                    out.put("profile", profile);

                    lastCapturedQqSig = cleanSig;
                    lastCapturedQqResultJson = out.toString();
                    return out.toString();
                }

                JSONObject waitOut = new JSONObject();
                waitOut.put("success", true);
                waitOut.put("code", 801);
                waitOut.put("message", (ptMessage != null && !ptMessage.isEmpty()) ? ptMessage : "等待扫码中...");
                return waitOut.toString();
            } catch (Exception e) {
                return "{\"success\":true,\"code\":801,\"message\":\"等待手机端扫码中...\"}";
            }
        }

        @JavascriptInterface
        public int getDeviceRefreshRate() {
            try {
                if (context instanceof MainActivity) {
                    return ((MainActivity) context).getDetectedRefreshRate();
                }
            } catch (Exception ignored) {}
            return 60;
        }

        @JavascriptInterface
        public int getSafeTopDp() {
            try {
                if (context instanceof MainActivity) {
                    return ((MainActivity) context).getLastSafeTopDp();
                }
            } catch (Exception ignored) {}
            return 48;
        }

        @JavascriptInterface
        public void boostFrameRate(final int durationMs) {
            try {
                if (context instanceof MainActivity) {
                    final MainActivity act = (MainActivity) context;
                    act.runOnUiThread(() -> act.triggerKeepAliveBoost(durationMs));
                }
            } catch (Exception ignored) {}
        }
    }
}
