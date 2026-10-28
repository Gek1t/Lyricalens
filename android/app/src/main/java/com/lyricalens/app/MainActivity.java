package com.lyricalens.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Display;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
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

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

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

        // 3. Unlock 120Hz / highest available display refresh rate
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Display display = null;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    display = getDisplay();
                }
                if (display == null) {
                    display = window.getWindowManager().getDefaultDisplay();
                }
                if (display != null) {
                    Display.Mode[] modes = display.getSupportedModes();
                    Display.Mode bestMode = null;
                    float maxRefreshRate = 60.0f;
                    for (Display.Mode mode : modes) {
                        if (mode.getRefreshRate() > maxRefreshRate) {
                            maxRefreshRate = mode.getRefreshRate();
                            bestMode = mode;
                        }
                    }
                    if (bestMode != null) {
                        WindowManager.LayoutParams lp = window.getAttributes();
                        lp.preferredDisplayModeId = bestMode.getModeId();
                        lp.preferredRefreshRate = maxRefreshRate;
                        window.setAttributes(lp);
                    }
                }
            } catch (Exception e) {
                // Ignore fallback
            }
        }

        // 4. Accurately measure punch-hole / cutout depth and inject CSS safe-area variables
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
            final int topDp = Math.max((int) (topInsetPx / density), 48);

            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.post(() -> {
                    webView.evaluateJavascript(
                        "document.documentElement.style.setProperty('--android-safe-top', '" + topDp + "px');",
                        null
                    );
                });
            }
            return windowInsets;
        });

        // 5. Hardware acceleration, external scheme handling & WebView optimizations
        setupWebViewAndBridge();
        window.getDecorView().post(this::setupWebViewAndBridge);
    }

    private void setupWebViewAndBridge() {
        try {
            Bridge bridge = getBridge();
            WebView webView = bridge != null ? bridge.getWebView() : null;
            if (webView != null) {
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                WebSettings webSettings = webView.getSettings();
                webSettings.setDomStorageEnabled(true);
                webSettings.setDatabaseEnabled(true);
                
                // Enable Cookies & Third-party cookies for seamless auth
                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    cookieManager.setAcceptThirdPartyCookies(webView, true);
                }

                // Register custom BridgeWebViewClient to reliably intercept and handle external schemes (mqq://, qqmusic://, intent://, etc.)
                if (bridge != null) {
                    bridge.setWebViewClient(new BridgeWebViewClient(bridge) {
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
                }

                // Register Native MediaStore Image Saver Bridge for seamless QR saving to Gallery & App Scheme Invocation
                webView.addJavascriptInterface(new AndroidNativeMediaBridge(MainActivity.this), "AndroidNativeMedia");
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
    }
}
