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
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.DisplayCutoutCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
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

        // 5. Hardware acceleration & WebView optimizations
        window.getDecorView().post(() -> {
            try {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
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

                    // Register Native MediaStore Image Saver Bridge for seamless QR saving to Gallery
                    webView.addJavascriptInterface(new AndroidNativeMediaBridge(MainActivity.this), "AndroidNativeMedia");
                }
            } catch (Exception e) {
                // Ignore
            }
        });
    }

    public static class AndroidNativeMediaBridge {
        private final Context context;

        public AndroidNativeMediaBridge(Context context) {
            this.context = context;
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
