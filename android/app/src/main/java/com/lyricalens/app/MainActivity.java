package com.lyricalens.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
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
import java.io.OutputStream;
import java.lang.reflect.Method;

public class MainActivity extends BridgeActivity {
    private volatile int detectedRefreshRate = 60;
    private volatile int lastSafeTopDp = 48;
    private boolean isWebViewConfigured = false;
    private DisplayManager.DisplayListener displayListener = null;
    private HighFpsKeepAliveView highFpsKeepAliveView = null;

    /**
     * 1x1px Hardware RenderNode VSync Keep-Alive View.
     * Defeats Xiaomi (HyperOS/MIUI), OPPO/OnePlus (ColorOS), and vivo/iQOO (OriginOS) 60Hz WebView whitelist throttling
     * by keeping Android's native ViewRootImpl & RenderThread actively voting for 90Hz/120Hz/144Hz VSync during all touch & animation windows.
     */
    private static final class HighFpsKeepAliveView extends View {
        private final Paint paint = new Paint();
        private boolean toggle = false;
        private long boostUntilMs = 0L;

        public HighFpsKeepAliveView(Context context) {
            super(context);
            setClickable(false);
            setFocusable(false);
            setAlpha(0.004f);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            }
        }

        public void triggerBoost(long durationMs) {
            long target = SystemClock.uptimeMillis() + Math.min(Math.max(durationMs, 300L), 10000L);
            if (target > boostUntilMs) {
                boostUntilMs = target;
            }
            postInvalidateOnAnimation();
        }

        public void stopBoost() {
            boostUntilMs = 0L;
            setTranslationX(0.0f);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            toggle = !toggle;
            setTranslationX(toggle ? 0.05f : 0.0f);
            paint.setColor(toggle ? 0x01FFFFFF : 0x01FEFEFE);
            canvas.drawRect(0, 0, 1, 1, paint);
            if (SystemClock.uptimeMillis() < boostUntilMs) {
                postInvalidateOnAnimation();
            }
        }
    }

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

        // 3. Attach 1x1px native RenderThread VSync Keep-Alive View for Chinese OEM ROMs (HyperOS/ColorOS/OriginOS)
        attachHighFpsKeepAliveView();

        // 4. Unlock 90Hz / 120Hz / 144Hz native display refresh rate matching active physical resolution
        applyHighRefreshRateMode();
        registerDynamicDisplayListener();

        // 5. Accurately measure punch-hole / cutout depth and inject CSS safe-area & refresh rate variables
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
            lastSafeTopDp = Math.max((int) (topInsetPx / density), 48);
            injectMetricsToWebView();
            return windowInsets;
        });

        // 6. Hardware acceleration, external scheme handling & WebView optimizations
        setupWebViewAndBridge();
        window.getDecorView().post(this::setupWebViewAndBridge);
    }

    private void attachHighFpsKeepAliveView() {
        try {
            if (highFpsKeepAliveView != null) return;
            ViewGroup contentParent = findViewById(android.R.id.content);
            if (contentParent != null) {
                highFpsKeepAliveView = new HighFpsKeepAliveView(this);
                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(1, 1, Gravity.TOP | Gravity.START);
                contentParent.addView(highFpsKeepAliveView, params);
                highFpsKeepAliveView.triggerBoost(3500L);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (highFpsKeepAliveView != null && ev != null) {
            int action = ev.getActionMasked();
            if (action == MotionEvent.ACTION_DOWN
                || action == MotionEvent.ACTION_MOVE
                || action == MotionEvent.ACTION_POINTER_DOWN
                || action == MotionEvent.ACTION_UP
                || action == MotionEvent.ACTION_CANCEL) {
                highFpsKeepAliveView.triggerBoost(2800L);
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    public void boostNativeFrameRate(long durationMs) {
        if (highFpsKeepAliveView != null) {
            highFpsKeepAliveView.post(() -> highFpsKeepAliveView.triggerBoost(durationMs));
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyHighRefreshRateMode();
        if (highFpsKeepAliveView != null) {
            highFpsKeepAliveView.triggerBoost(3000L);
        }
    }

    @Override
    public void onPause() {
        if (highFpsKeepAliveView != null) {
            highFpsKeepAliveView.stopBoost();
        }
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyHighRefreshRateMode();
            if (highFpsKeepAliveView != null) {
                highFpsKeepAliveView.triggerBoost(2500L);
            }
        } else if (highFpsKeepAliveView != null) {
            highFpsKeepAliveView.stopBoost();
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyHighRefreshRateMode();
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
                        applyHighRefreshRateMode();
                    }
                };
                dm.registerDisplayListener(displayListener, new Handler(Looper.getMainLooper()));
            }
        } catch (Exception ignored) {}
    }

    private void injectMetricsToWebView() {
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView == null) return;
            final int fps = detectedRefreshRate;
            final int topDp = lastSafeTopDp;
            final String budgetMs = String.format(java.util.Locale.US, "%.2fms", 1000.0f / Math.max(60, fps));
            webView.post(() -> {
                try {
                    webView.evaluateJavascript(
                        "window.__DEVICE_REFRESH_RATE__ = " + fps + ";" +
                        "if (window.document && window.document.documentElement) {" +
                        "  var r = window.document.documentElement;" +
                        "  r.style.setProperty('--android-safe-top', '" + topDp + "px');" +
                        "  r.style.setProperty('--device-fps', '" + fps + "');" +
                        "  r.style.setProperty('--frame-budget-ms', '" + budgetMs + "');" +
                        "  r.dataset.refreshRate = '" + fps + "';" +
                        "}",
                        null
                    );
                } catch (Exception ignored) {}
            });
        } catch (Exception ignored) {}
    }

    private void applyHighRefreshRateMode() {
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
            if (roundedFps >= 132) {
                detectedRefreshRate = 144;
            } else if (roundedFps >= 105) {
                detectedRefreshRate = 120;
            } else if (roundedFps >= 75) {
                detectedRefreshRate = 90;
            } else {
                detectedRefreshRate = 60;
            }

            applyRequestedFrameRateOnViews(preferredRateHint);
            injectMetricsToWebView();
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
                    if (highFpsKeepAliveView != null) setReqRate.invoke(highFpsKeepAliveView, targetFrameRate);
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

                // Register Native MediaStore Image Saver Bridge for seamless QR saving to Gallery & App Scheme Invocation
                webView.addJavascriptInterface(new AndroidNativeMediaBridge(MainActivity.this), "AndroidNativeMedia");

                // Register custom BridgeWebViewClient to reliably intercept external schemes and replay DOM metrics after navigation commit
                bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public void onPageCommitVisible(WebView view, String url) {
                        super.onPageCommitVisible(view, url);
                        injectMetricsToWebView();
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        injectMetricsToWebView();
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            Uri reqUri = request.getUrl();
                            if (isExternalScheme(reqUri)) {
                                handleExternalUri(reqUri);
                                return true; // Crucial: absorb external scheme so WebView never displays net::ERR_UNKNOWN_URL_SCHEME
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

                injectMetricsToWebView();
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

        // Pass standard web and internal navigations to webview
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
                // Fallback A: Explicitly target Mobile QQ package
                try {
                    Intent qqExplicitIntent = new Intent(Intent.ACTION_VIEW, uri);
                    qqExplicitIntent.setPackage("com.tencent.mobileqq");
                    qqExplicitIntent.addCategory(Intent.CATEGORY_BROWSABLE);
                    qqExplicitIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(qqExplicitIntent);
                    return true;
                } catch (Exception ignored) {}

                // Fallback B: Toggle alternative QQ scan scheme (scan_qr <-> scan_qrcode)
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

                // Fallback C: Launch Mobile QQ package main activity
                try {
                    Intent qqIntent = getPackageManager().getLaunchIntentForPackage("com.tencent.mobileqq");
                    if (qqIntent != null) {
                        qqIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(qqIntent);
                        return true;
                    }
                } catch (Exception ignored) {}

                // Fallback D: Try TIM package main activity
                try {
                    Intent timIntent = getPackageManager().getLaunchIntentForPackage("com.tencent.tim");
                    if (timIntent != null) {
                        timIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(timIntent);
                        return true;
                    }
                } catch (Exception ignored) {}

                // Fallback E: Base mqq:// view intent
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

    public static class AndroidNativeMediaBridge {
        private final Context context;

        public AndroidNativeMediaBridge(Context context) {
            this.context = context;
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
                String cookies = CookieManager.getInstance().getCookie(url);
                return cookies != null ? cookies : "";
            } catch (Exception e) {
                return "";
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
        public void boostFrameRate(int durationMs) {
            try {
                if (context instanceof MainActivity) {
                    ((MainActivity) context).boostNativeFrameRate((long) durationMs);
                }
            } catch (Exception ignored) {}
        }
    }
}
