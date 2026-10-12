package com.droidtranslator.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.droidtranslator.app.engine.RootController;
import com.droidtranslator.app.service.TranslationForegroundService;

import android.content.ContentValues;
import android.content.ContentResolver;
import android.provider.MediaStore;
import android.webkit.DownloadListener;
import androidx.core.content.FileProvider;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import android.util.Base64;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "DroidTranslatorMain";
    private static final int FILE_CHOOSER_REQUEST_CODE = 2026;
    private static final int PERMISSION_REQUEST_CODE = 101;

    private WebView webView;
    private ProgressBar loadingBar;
    private ValueCallback<Uri[]> mFilePathCallback;

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Cấu hình giao diện tối AMOLED sang trọng toàn màn hình
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        // Đặt màu status bar và navigation bar đồng bộ màu dark #0a0a0a
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#0a0a0a"));
            window.setNavigationBarColor(Color.parseColor("#0a0a0a"));
        }

        // Kích hoạt bảo vệ Root & OOM score -1000 ngay khi khởi động
        if (RootController.isRootAvailable()) {
            RootController.applyGodModeKernelProtection();
            Log.d(TAG, "GodMode Kernel Protection Applied (-1000 OOM)");
        }

        // Khởi tạo Root layout container
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootLayout.setBackgroundColor(Color.parseColor("#09090b"));

        // Khởi tạo WebView cao cấp
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        webView.setBackgroundColor(Color.parseColor("#09090b"));

        // Khởi tạo thanh tiến trình tải trang mảnh
        loadingBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        loadingBar.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3)
        ));
        loadingBar.setMax(100);
        loadingBar.setProgress(0);
        loadingBar.setVisibility(View.VISIBLE);

        rootLayout.addView(webView);
        rootLayout.addView(loadingBar);
        setContentView(rootLayout);

        setupWebViewSettings();
        setupWebViewClients();

        // Đăng ký Native Bridge JavaScriptInterface để web giao tiếp với phần cứng Android
        webView.addJavascriptInterface(new AndroidNativeBridge(), "AndroidBridge");

        // Yêu cầu quyền thông báo và chạy ngầm
        checkAndRequestPermissions();

        // Tải bộ Web App Studio từ Assets cục bộ
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private int dp(float dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebViewSettings() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        // Bật tăng tốc phần cứng
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    private void setupWebViewClients() {
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (loadingBar != null) {
                    loadingBar.setProgress(newProgress);
                    if (newProgress >= 100) {
                        loadingBar.setVisibility(View.GONE);
                    } else {
                        loadingBar.setVisibility(View.VISIBLE);
                    }
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("DroidTransWeb", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }

            // Hỗ trợ chọn file .txt, .epub, glossary từ bộ nhớ máy
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                    mFilePathCallback = null;
                }
                mFilePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                String[] mimetypes = {"text/plain", "application/epub+zip", "application/octet-stream"};
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);

                try {
                    startActivityForResult(Intent.createChooser(intent, "Chọn file tiểu thuyết / Từ điển"), FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    mFilePathCallback = null;
                    Toast.makeText(MainActivity.this, "Không thể mở bộ chọn file: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("file:///android_asset/")) {
                    return false;
                }
                // Nếu bấm link ngoài (aistudio, github...), mở trình duyệt hệ thống
                try {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(browserIntent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                Log.e(TAG, "WebView error: " + error.getDescription());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (loadingBar != null) {
                    loadingBar.setVisibility(View.GONE);
                }
            }
        });

        // Bắt sự kiện tải xuống từ trình duyệt WebView (blob, data URL, http URL)
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    Log.w(TAG, "WebView onDownloadStart: " + e.getMessage());
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getClipData() != null) {
                        ClipData clip = data.getClipData();
                        results = new Uri[clip.getItemCount()];
                        for (int i = 0; i < clip.getItemCount(); i++) {
                            results[i] = clip.getItemAt(i).getUri();
                        }
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        }
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // Giữ cho dịch ngầm không bị tắt khi bấm Back ở trang chủ
            moveTaskToBack(true);
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    /**
     * Cầu nối JavaScript Interface:
     * Cho phép giao diện Web gọi trực tiếp các tính năng Native của Android (Foreground Service, Root, File I/O, Toast)
     */
    public class AndroidNativeBridge {

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public boolean isRootAvailable() {
            return RootController.isRootAvailable();
        }

        @JavascriptInterface
        public boolean applyGodModeRoot() {
            return RootController.applyGodModeKernelProtection();
        }

        @JavascriptInterface
        public void startForegroundService(final String info) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Intent serviceIntent = new Intent(MainActivity.this, TranslationForegroundService.class);
                    serviceIntent.putExtra("INFO", info != null ? info : "Tiến trình dịch ngầm DroidTranslator đang chạy");
                    ContextCompat.startForegroundService(MainActivity.this, serviceIntent);
                    Log.d(TAG, "Foreground service started from Web: " + info);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start foreground service: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void stopForegroundService() {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Intent serviceIntent = new Intent(MainActivity.this, TranslationForegroundService.class);
                    MainActivity.this.stopService(serviceIntent);
                    Log.d(TAG, "Foreground service stopped from Web");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to stop foreground service: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void showToast(final String message) {
            new Handler(Looper.getMainLooper()).post(() ->
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show()
            );
        }

        @JavascriptInterface
        public void copyToClipboard(final String text) {
            new Handler(Looper.getMainLooper()).post(() -> {
                ClipboardManager clipboard = (ClipboardManager) MainActivity.this.getSystemService(Context.CLIPBOARD_SERVICE);
                if (clipboard != null) {
                    ClipData clip = ClipData.newPlainText("DroidTranslator", text);
                    clipboard.setPrimaryClip(clip);
                    Toast.makeText(MainActivity.this, "Đã sao chép vào bộ nhớ tạm", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public boolean saveFile(final String filename, final String content) {
            if (filename == null || content == null) return false;
            try {
                byte[] bytes = content.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                return writeBytesToStorage(filename, bytes, "text/plain");
            } catch (Exception e) {
                Log.e(TAG, "Lỗi saveFile: " + e.getMessage());
                showToast("Lỗi khi lưu tệp: " + e.getMessage());
                return false;
            }
        }

        @JavascriptInterface
        public boolean saveFileBase64(final String filename, final String base64Content, final String mimeType) {
            if (filename == null || base64Content == null) return false;
            try {
                byte[] bytes = Base64.decode(base64Content, Base64.DEFAULT);
                return writeBytesToStorage(filename, bytes, mimeType != null ? mimeType : "application/octet-stream");
            } catch (Exception e) {
                Log.e(TAG, "Lỗi saveFileBase64: " + e.getMessage());
                showToast("Lỗi khi lưu tệp: " + e.getMessage());
                return false;
            }
        }

        @JavascriptInterface
        public void openExportDirectory() {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(Uri.parse(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getPath()), "*/*");
                    startActivity(Intent.createChooser(intent, "Mở thư mục Tải về (Download)"));
                } catch (Exception e) {
                    showToast("Tệp được lưu trong thư mục Download của máy");
                }
            });
        }

        private boolean writeBytesToStorage(String filename, byte[] bytes, String mimeType) {
            boolean success = false;
            String savedLocation = "";

            // 1. Dùng MediaStore API hiện đại cho Android 10+ (API 29+) -> Tệp xuất hiện 100% trong Download
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try {
                    ContentResolver resolver = MainActivity.this.getContentResolver();
                    ContentValues contentValues = new ContentValues();
                    contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    contentValues.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DroidTranslator");

                    Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
                    if (uri != null) {
                        OutputStream os = resolver.openOutputStream(uri);
                        if (os != null) {
                            os.write(bytes);
                            os.flush();
                            os.close();
                            success = true;
                            savedLocation = "Download/DroidTranslator/" + filename;
                        }
                    }
                } catch (Exception e) {
                    Log.w(TAG, "MediaStore insert failed, falling back: " + e.getMessage());
                }
            }

            // 2. Dự phòng: Ghi trực tiếp vào thư mục công khai Download
            if (!success) {
                try {
                    java.io.File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadDir != null) {
                        if (!downloadDir.exists()) downloadDir.mkdirs();
                        java.io.File target = new java.io.File(downloadDir, filename);
                        java.io.FileOutputStream fos = new java.io.FileOutputStream(target);
                        fos.write(bytes);
                        fos.flush();
                        fos.close();
                        success = true;
                        savedLocation = target.getAbsolutePath();
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Direct Download write failed: " + e.getMessage());
                }
            }

            // 3. Dự phòng cấp 3: Ghi vào externalFilesDir của App (Android/data/com.droidtranslator.app/files/Download)
            if (!success) {
                try {
                    java.io.File appExtDir = MainActivity.this.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (appExtDir != null) {
                        if (!appExtDir.exists()) appExtDir.mkdirs();
                        java.io.File target = new java.io.File(appExtDir, filename);
                        java.io.FileOutputStream fos = new java.io.FileOutputStream(target);
                        fos.write(bytes);
                        fos.flush();
                        fos.close();
                        success = true;
                        savedLocation = target.getAbsolutePath();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "App externalFilesDir write failed: " + e.getMessage());
                }
            }

            if (success) {
                final String finalLoc = savedLocation;
                new Handler(Looper.getMainLooper()).post(() ->
                    Toast.makeText(MainActivity.this, "✅ Đã lưu tệp vào: " + finalLoc, Toast.LENGTH_LONG).show()
                );
                return true;
            } else {
                new Handler(Looper.getMainLooper()).post(() ->
                    Toast.makeText(MainActivity.this, "❌ Không thể ghi tệp vào bộ nhớ", Toast.LENGTH_SHORT).show()
                );
                return false;
            }
        }

        @JavascriptInterface
        public void requestBatteryOptimizationIgnore() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    PowerManager pm = (PowerManager) MainActivity.this.getSystemService(Context.POWER_SERVICE);
                    if (pm != null && !pm.isIgnoringBatteryOptimizations(MainActivity.this.getPackageName())) {
                        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + MainActivity.this.getPackageName()));
                        MainActivity.this.startActivity(intent);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Lỗi cấp quyền bỏ tối ưu pin: " + e.getMessage());
                }
            }
        }
    }
}
