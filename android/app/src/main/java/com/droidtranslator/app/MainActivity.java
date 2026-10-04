package com.droidtranslator.app;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.droidtranslator.app.engine.HanziSweeperEngine;
import com.droidtranslator.app.engine.RootController;
import com.droidtranslator.app.model.ApiKeyItem;
import com.droidtranslator.app.model.PromptCardItem;
import com.droidtranslator.app.service.TranslationForegroundService;
import com.google.android.material.tabs.TabLayout;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import android.content.SharedPreferences;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;

public class MainActivity extends AppCompatActivity {

    private int dp(float dp) {
        return (int) (dp * getResources().getDisplayMetrics().density + 0.5f);
    }

    private static class HelpData {
        final String title;
        final String category;
        final String whatIsIt;
        final String howToUse;
        final String proTip;

        HelpData(String title, String category, String whatIsIt, String howToUse, String proTip) {
            this.title = title;
            this.category = category;
            this.whatIsIt = whatIsIt;
            this.howToUse = howToUse;
            this.proTip = proTip;
        }
    }

    private final Map<String, HelpData> helpMap = new HashMap<>();

    private void initHelpMap() {
        if (!helpMap.isEmpty()) return;
        helpMap.put("select_model", new HelpData(
            "Lựa Chọn Model Dịch (Mô Hình AI)",
            "Cấu Hình Động Cơ AI",
            "Chọn bộ não AI của Google để thực hiện dịch thuật toàn văn tác phẩm.",
            "• Gemini 2.5 Flash-Lite / 3.5 Flash-Lite: Khuyên dùng cho truyện dài (>10MB). Tốc độ siêu nhanh, hạn ngạch dồi dào không lo nghẽn mạng. Hệ thống tự động cứu hộ sẽ vá mượt bản dịch đạt 9/10 điểm.\n• Gemini 2.5 Flash / 3.6 Flash: Dành cho dịch đoạn ngắn cần độ trau chuốt tuyệt đối.",
            "Bạn cũng có thể nhập mã Model ID tùy biến của Google vào ô bên cạnh rồi bấm 'Dùng Model Này'."
        ));
        helpMap.put("model_selection", helpMap.get("select_model"));

        helpMap.put("key_pool", new HelpData(
            "Multi-Key Gemini Pool (Kho Chìa Khóa API)",
            "Quản Lý Khóa API",
            "Nơi lưu trữ danh sách API Key Google Gemini của bạn. Ứng dụng sẽ tự động luân phiên đổi chìa khóa khi dịch để không bao giờ bị nghẽn mạng hay chạm Rate Limit 429.",
            "• Dán API key (mỗi dòng 1 key, hỗ trợ dán hàng loạt) rồi bấm 'Thêm API Key Vào Pool'.\n• Bấm 'Test Tất Cả' để kiểm tra kết nối và hạn mức từng key.\n• Có thể xóa hoặc test riêng lẻ từng key trong danh sách.",
            "NÊN DÙNG 2 - 5 TÀI KHOẢN GOOGLE để lấy 2 - 5 key nạp vào, giúp bạn dịch một mạch hàng nghìn chương liên tục!"
        ));

        helpMap.put("prompt_cards", new HelpData(
            "Thẻ Phong Cách Dịch (Prompt Cards)",
            "Văn Phong Dịch Thuật",
            "Quyết định văn phong bản dịch (Tiên hiệp cổ trang, Đô thị hiện đại, Kiếm hiệp kiếm khí...).",
            "• Nhấn vào thẻ phong cách để kích hoạt.\n• Bấm '+ Thêm Prompt' để tạo phong cách dịch theo sở thích của riêng bạn.\n• Chạm vào thẻ để xem hoặc chỉnh sửa nội dung prompt chi tiết.",
            "Có thể tạo prompt riêng biệt cho từng thể loại truyện để câu từ mượt mà, đúng chuẩn nhất."
        ));

        helpMap.put("novel_raw_input", new HelpData(
            "Mục 1: Nhập & Bóc Tách File Truyện Gốc",
            "Nạp & Phân Tích File",
            "Khu vực đưa truyện tiếng Trung thô vào và chia nhỏ thành từng chương để AI xử lý.",
            "• Chọn File .txt / .epub: Bấm để nạp file truyện từ bộ nhớ điện thoại vào app.\n• Tách Tác Giả (Regex): Tự động nhận diện dòng tiêu đề chương (第一章, 第1章, Chương 1, Hồi thứ 1...) để cắt chuẩn y như sách in. Khuyên dùng cho 95% truyện mạng.\n• Tách Theo Ký Tự: Cắt đều đặn theo số ký tự (2000, 3000, 3500 ký tự). Dành cho truyện ngắn hoặc file thô bị mất dòng tiêu đề chương.\n• Đổi Truyện / Dự Án Mới: Quản lý nhiều bộ truyện độc lập mà không bị đè dữ liệu.",
            "Độ dài tối ưu nhất cho AI dịch mượt là khoảng 3.000 - 3.500 ký tự mỗi chương."
        ));

        helpMap.put("range_progress", new HelpData(
            "Mục 2: Tiến Độ Dịch Thuật & Điều Khiển",
            "Tiến Trình Dịch",
            "Trung tâm điều khiển toàn bộ quá trình dịch thuật của bộ truyện.",
            "• Từ chương -> Đến chương: Nhập khoảng chương bạn muốn dịch (ví dụ: từ 1 đến 50).\n• Dịch Range: Khởi động quá trình dịch tự động tuần tự từng chương.\n• Tạm dừng / Tiếp tục: Dừng tạm thời khi có việc bận mà không làm mất chương đang dịch dở.\n• Hủy: Dừng hẳn tiến trình dịch an toàn.\n• ⚡ Dịch Bù Chương Sót: Tự động quét kiểm tra, phát hiện chương nào bị mất mạng/chưa dịch để dịch bù, và TỰ ĐỘNG BỎ QUA 100% các chương đã dịch xong.\n• ✨ Làm Mượt Bản Dịch Final: Khâu quét sạch toàn bộ chữ Hán và từ lai còn sót lại trong toàn tác phẩm sau khi bạn đã dịch xong.",
            "Nếu truyện dài, hãy dịch theo từng đợt 50 - 100 chương để dễ kiểm soát và lưu trữ."
        ));

        helpMap.put("master_glossary", new HelpData(
            "Mục 3: Kho Thuật Ngữ Master Glossary",
            "Từ Điển Tác Phẩm",
            "Bộ từ điển độc lập của tác phẩm, lưu giữ danh sách tên nhân vật, môn phái, chiêu thức, địa danh (VD: 林辰 = Lâm Thần).",
            "• Đảm bảo nhân vật giữ đúng một tên gọi xuyên suốt từ chương đầu đến chương cuối.\n• Thêm nhanh: Nhập 'Từ gốc' và 'Nghĩa dịch' rồi bấm '+ Thêm Từ'.\n• Nạp / Xuất .txt: Nhập hoặc xuất file từ điển dạng txt (raw=vi) để sao lưu hoặc chia sẻ.\n• Danh sách hiển thị trực tiếp bên dưới với nút Xóa từng từ.",
            "Nên kết hợp bật chức năng AI Auto-Learn ở Tab Cài đặt để AI tự động trích xuất nhân vật mới vào kho này."
        ));

        helpMap.put("chapter_auditor", new HelpData(
            "Kho Chương Đã Dịch & Trình Đọc AMOLED",
            "Đọc & Kiểm Tra Chất Lượng",
            "Không gian quản lý các chương đã dịch xong kèm Trình đọc toàn màn hình AMOLED/Sepia chống mỏi mắt.",
            "• Chạm vào bất kỳ chương nào trong danh sách để mở Trình Đọc Toàn Màn Hình.\n• Hỗ trợ 3 chế độ hiển thị: Bản Dịch, Song Ngữ (Đối Chiếu Trung-Việt) và Bản Gốc.\n• Đổi màu nền (AMOLED Đen Sâu, Sepia Dịu Mắt, Sáng) và cỡ chữ tùy ý.\n• Nút 'Dịch lại' trong từng chương giúp AI làm lại riêng chương đó nếu chưa ưng ý.\n• Phân trang 100 chương/trang chống giật lag khi truyện có hàng nghìn chương.",
            "Chế độ Song Ngữ cực kỳ hữu ích để bạn đối chiếu câu chữ gốc khi gặp đoạn dịch khó hiểu."
        ));

        helpMap.put("settings_projects_manager", new HelpData(
            "1. Quản Lý & Lưu Trữ Đa Dự Án Truyện",
            "Quản Lý Tác Phẩm",
            "Quản lý nhiều bộ truyện độc lập cùng lúc trên một thiết bị mà không bị lẫn lộn dữ liệu.",
            "• Mỗi dự án lưu giữ riêng biệt: toàn bộ các chương thô, bản dịch đã hoàn thành và từ điển Master Glossary riêng của bộ đó.\n• Bấm 'Chuyển Dự Án' để tiếp tục dịch hoặc đọc một bộ truyện khác.\n• Bấm '+ Tạo Mới' để bắt đầu một bộ truyện mới.\n• Nút 'Xóa Vĩnh Viễn Dự Án': Chỉ xóa nội dung của bộ truyện đang chọn. Kho Key API và các Thẻ Prompt ở Tab 1 được bảo toàn vĩnh cửu 100%!",
            "Bạn có thể lưu trữ hàng chục bộ truyện cùng lúc mà không lo mất dữ liệu."
        ));

        helpMap.put("settings_glossary_learning", new HelpData(
            "2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning)",
            "Bộ Lọc & Quản Lý Từ Điển",
            "Bộ quy chuẩn chất lượng để AI tự động lọc và thu thập tên nhân vật, chiêu thức, địa danh từ bản dịch vào Master Glossary.",
            "• Độ dài chữ Hán tối thiểu: Khuyên để 2 đến 4 ký tự. Ngăn AI tự ý đưa các từ 1 chữ (hắn, nàng, đi, đến...) vào từ điển làm rác văn bản.\n• Tần suất tối thiểu: Đặt >= 2 lần để chỉ ghi nhớ các nhân vật/địa danh quan trọng xuất hiện lặp lại trong chương.\n• Chính sách xung đột (Conflict Policy): 'Giữ Cũ - Bỏ Mới' (Khuyên dùng) giúp cố định tên nhân vật ban đầu, tránh việc cùng một nhân vật bị đổi tên lộn xộn ở các chương sau.",
            "Chính sách 'Giữ Cũ - Bỏ Mới' là chìa khóa vàng giúp toàn bộ 1000 chương truyện thống nhất tên gọi."
        ));

        helpMap.put("settings_translation_anti_hanzi", new HelpData(
            "3. Cài Đặt Dịch Thuật & Chống Lọt Chữ Hán",
            "Chất Lượng Bản Dịch & Đa Ngôn Ngữ",
            "Kiểm soát ngôn ngữ dịch đầu ra và hệ thống phòng thủ chống sót chữ Hán 2 lớp (Dual-Layer Guard).",
            "• Ngôn ngữ đích: Chọn Tiếng Việt, Tiếng Nhật, Tiếng Anh hoặc Tiếng Hàn.\n• Bộ lọc chống lọt chữ Hán 2 lớp:\n  - Lớp 1 (Ép khuôn Prompt): Cấm AI sinh chữ tượng hình Hán trong câu trả lời.\n  - Lớp 2 (Hậu kiểm Regex): Tự động quét regex [\\u4e00-\\u9fa5] để chuyển đổi triệt để sang âm Hán-Việt chuẩn, bản dịch sạch 100% tiếng Việt!\n• Tự Động Dịch Lại Khi Lỗi Nặng: Tự động gửi yêu cầu dịch lại nếu AI bị kẹt hoặc đứt mạng.",
            "Nếu chọn ngôn ngữ đích là Tiếng Nhật, app sẽ tự động thả lỏng để AI sinh chữ Kanji tự nhiên."
        ));

        helpMap.put("settings_god_mode", new HelpData(
            "4. Kiểm Soát 5 Lớp Chạy Ngầm (God-Mode)",
            "Độ Bền Bỉ Hệ Thống Android",
            "Kiến trúc dịch ngầm độc quyền giúp ứng dụng dịch liên tục hàng nghìn chương ngay cả khi tắt màn hình, khóa máy hoặc máy ít RAM.",
            "• Lớp 1 (Foreground Service): Hiển thị tiến trình dịch liên tục trên thanh thông báo hệ thống.\n• Lớp 2 (CPU WakeLock): Giữ chip xử lý chạy ngầm, chống Deep Sleep khi tắt màn hình.\n• Lớp 3 (Bỏ qua tối ưu pin Doze Mode): Miễn nhiễm với cơ chế tự ngắt ứng dụng của Android.\n• Lớp 4 (WorkManager Watchdog): Tự động kiểm tra và hồi sinh tiến trình sau 15 giây nếu bị Android vô tình giải phóng RAM.\n• Lớp 5 (Root OOM Score -1000): Thiết lập độ ưu tiên tối thượng tương đương tiến trình nhân hệ thống (dành cho máy Root).",
            "Bạn hoàn toàn có thể cắm sạc, khóa màn hình và đi ngủ, sáng dậy sẽ có hàng trăm chương truyện đã dịch xong!"
        ));

        helpMap.put("settings_api_rotation", new HelpData(
            "5. Cấu Hình Model Làm Mượt Final & Độ Trễ",
            "Động Cơ Xử Lý Nâng Cao",
            "Cấu hình model phục vụ khâu rà soát văn phong cuối cùng và độ trễ an toàn giữa các chương.",
            "• Model làm mượt Final: Khuyên dùng Gemini 3.6 Flash hoặc Gemini 2.5 Flash để rà soát lại ngữ pháp, khử sạch chữ Hán sót lại.\n• Độ trễ an toàn giữa các chương: Đặt từ 1 đến 3 giây để giãn cách các lượt gọi API, chống bị hệ thống Google đánh dấu nghi ngờ spam.",
            "Sau khi dịch trọn bộ truyện, chạy Làm Mượt Final một lần sẽ nâng tầm toàn văn tác phẩm lên chất lượng xuất bản."
        ));

        helpMap.put("export_full_txt", new HelpData(
            "Xuất Toàn Văn Tác Phẩm (.txt)",
            "Xuất Dữ Liệu Hoàn Tất",
            "Gộp toàn bộ tất cả các chương đã dịch thành một file văn bản hoàn chỉnh (.txt) duy nhất.",
            "• Bấm nút '📥 Xuất Toàn Văn Tác Phẩm (.txt)' để lưu file vào thư mục Download của thiết bị.\n• File sau khi xuất có tiêu đề rõ ràng, phân cách từng chương chuẩn mực.\n• Sẵn sàng để copy vào máy đọc sách Kindle, Kobo hoặc mở bằng bất kỳ ứng dụng đọc sách nào trên điện thoại.",
            "File xuất ra mã hóa UTF-8 chuẩn 100%, không bị lỗi font trên bất kỳ thiết bị nào."
        ));
    }

    private View createStepCard(int stepNum, String title, String accentHex, String contentText, String proTip) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#121212"));
        bg.setCornerRadius(dp(16));
        bg.setStroke(dp(1.2f), Color.parseColor(accentHex));
        card.setBackground(bg);
        card.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(12));
        card.setLayoutParams(lp);

        LinearLayout head = new LinearLayout(this);
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvBadge = new TextView(this);
        tvBadge.setText(String.valueOf(stepNum));
        tvBadge.setTextColor(Color.parseColor(accentHex));
        tvBadge.setTextSize(12);
        tvBadge.setTypeface(null, Typeface.BOLD);
        tvBadge.setGravity(Gravity.CENTER);
        GradientDrawable badgeBg = new GradientDrawable();
        badgeBg.setColor(Color.parseColor("#1F2937"));
        badgeBg.setCornerRadius(dp(20));
        badgeBg.setStroke(dp(1), Color.parseColor(accentHex));
        tvBadge.setBackground(badgeBg);
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(dp(22), dp(22));
        blp.rightMargin = dp(8);
        tvBadge.setLayoutParams(blp);
        head.addView(tvBadge);

        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextColor(Color.parseColor(accentHex));
        tvTitle.setTextSize(13);
        tvTitle.setTypeface(null, Typeface.BOLD);
        head.addView(tvTitle);
        card.addView(head);

        TextView tvContent = new TextView(this);
        tvContent.setText(contentText);
        tvContent.setTextColor(Color.parseColor("#E5E7EB"));
        tvContent.setTextSize(12);
        tvContent.setLineSpacing(dp(2), 1.15f);
        tvContent.setPadding(0, dp(8), 0, 0);
        card.addView(tvContent);

        if (proTip != null && !proTip.isEmpty()) {
            LinearLayout tipBox = new LinearLayout(this);
            tipBox.setOrientation(LinearLayout.VERTICAL);
            GradientDrawable tipBg = new GradientDrawable();
            tipBg.setColor(Color.parseColor("#271804"));
            tipBg.setCornerRadius(dp(10));
            tipBg.setStroke(dp(1), Color.parseColor("#B45309"));
            tipBox.setBackground(tipBg);
            tipBox.setPadding(dp(10), dp(8), dp(10), dp(8));
            LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            tlp.setMargins(0, dp(8), 0, 0);
            tipBox.setLayoutParams(tlp);

            TextView tvTip = new TextView(this);
            tvTip.setText("💡 Mẹo Hay: " + proTip);
            tvTip.setTextColor(Color.parseColor("#FDE68A"));
            tvTip.setTextSize(11);
            tvTip.setLineSpacing(dp(1), 1.1f);
            tipBox.addView(tvTip);
            card.addView(tipBox);
        }

        return card;
    }

    private void showHowToUseDialog() {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        GradientDrawable rootBg = new GradientDrawable();
        rootBg.setColor(Color.parseColor("#171717"));
        rootBg.setCornerRadius(dp(24));
        rootBg.setStroke(dp(1.5f), Color.parseColor("#3B82F6"));
        root.setBackground(rootBg);
        root.setPadding(dp(18), dp(18), dp(18), dp(18));

        // HEADER
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(0, 0, 0, dp(14));

        TextView tvIcon = new TextView(this);
        tvIcon.setText("📖");
        tvIcon.setTextSize(18);
        tvIcon.setGravity(Gravity.CENTER);
        GradientDrawable iconBg = new GradientDrawable();
        iconBg.setColor(Color.parseColor("#1E3A8A"));
        iconBg.setCornerRadius(dp(14));
        iconBg.setStroke(dp(1), Color.parseColor("#3B82F6"));
        tvIcon.setBackground(iconBg);
        tvIcon.setPadding(dp(8), dp(6), dp(8), dp(6));
        header.addView(tvIcon);

        View sp1 = new View(this);
        header.addView(sp1, new LinearLayout.LayoutParams(dp(10), 1));

        LinearLayout colTitle = new LinearLayout(this);
        colTitle.setOrientation(LinearLayout.VERTICAL);

        TextView tvMainTitle = new TextView(this);
        tvMainTitle.setText("Cẩm Nang Hướng Dẫn Toàn Diện");
        tvMainTitle.setTextColor(Color.WHITE);
        tvMainTitle.setTextSize(15);
        tvMainTitle.setTypeface(null, Typeface.BOLD);
        colTitle.addView(tvMainTitle);

        TextView tvSubTitle = new TextView(this);
        tvSubTitle.setText("Từ A đến Z cho người mới bắt đầu dịch");
        tvSubTitle.setTextColor(Color.parseColor("#93C5FD"));
        tvSubTitle.setTextSize(11);
        colTitle.addView(tvSubTitle);

        header.addView(colTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView btnClose = new TextView(this);
        btnClose.setText("✕");
        btnClose.setTextColor(Color.parseColor("#9CA3AF"));
        btnClose.setTextSize(14);
        btnClose.setTypeface(null, Typeface.BOLD);
        btnClose.setGravity(Gravity.CENTER);
        GradientDrawable closeBg = new GradientDrawable();
        closeBg.setColor(Color.parseColor("#27272A"));
        closeBg.setCornerRadius(dp(20));
        btnClose.setBackground(closeBg);
        btnClose.setPadding(dp(10), dp(6), dp(10), dp(6));
        btnClose.setOnClickListener(v -> dialog.dismiss());
        header.addView(btnClose);

        root.addView(header);

        View div = new View(this);
        div.setBackgroundColor(Color.parseColor("#27272A"));
        root.addView(div, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));

        LinearLayout listSteps = new LinearLayout(this);
        listSteps.setOrientation(LinearLayout.VERTICAL);
        listSteps.setPadding(0, dp(14), 0, 0);

        // BƯỚC 1: Amber
        listSteps.addView(createStepCard(
            1, "Bước 1: Lấy API Key Miễn Phí & Nạp Nhiều Key", "#F59E0B",
            "• Cách lấy key: Truy cập aistudio.google.com trên trình duyệt ➔ Đăng nhập Google ➔ Bấm 'Get API key' ➔ Tạo khóa và copy.\n• Nạp key: Dán vào ô nhập ở Thẻ 1 rồi bấm 'Thêm API Key Vào Pool'.",
            "Mỗi tài khoản Google được miễn phí 15 lượt/phút. Bạn NÊN DÙNG 2 ĐẾN 5 TÀI KHOẢN GOOGLE để lấy 2 - 5 key khác nhau nạp vào app. App sẽ tự động xoay tua từng key, giúp bạn dịch hàng ngàn chương liên tục không bao giờ bị nghẽn mạng hay chạm hạn mức!"
        ));

        // BƯỚC 2: Blue
        listSteps.addView(createStepCard(
            2, "Bước 2: Tạo Dự Án & Nạp File Truyện Gốc", "#3B82F6",
            "• Chuyển sang Thẻ 2 'Dịch & Từ điển' ➔ Bấm '+ Dự Án Mới' để đặt tên cho bộ truyện.\n• Bấm '📂 Chọn File .txt/.epub' để tải file truyện tiếng Trung vào.\n• Chọn chế độ 'Tách Tác Giả (Regex)' để app tự động cắt từng chương chuẩn xác theo tiêu đề.",
            "Nên dùng chế độ Tách Tác Giả cho 95% truyện mạng để giữ nguyên vẹn tiêu đề chương của tác giả."
        ));

        // BƯỚC 3: Emerald
        listSteps.addView(createStepCard(
            3, "Bước 3: Chọn Khoảng Chương & Chọn Model Phù Hợp", "#10B981",
            "• Điền khoảng chương cần dịch (ví dụ: Từ chương 1 đến chương 50).\n• KHUYÊN DÙNG CHO TRUYỆN DÀI (>10MB): Hãy chọn Gemini 2.5 Flash-Lite hoặc Gemini 3.5 Flash-Lite vì tốc độ siêu nhanh và hạn ngạch dồi dào. Các lỗi nhỏ sẽ được hệ thống cứu hộ tự vá mượt đạt 9/10 điểm!\n• Gemini 2.5 Flash / 3.6 Flash: Dành cho khi bạn dịch đoạn ngắn cần độ trau chuốt tuyệt đối.",
            "Chọn Gemini Flash-Lite giúp bạn dịch một mạch cả bộ truyện mà không bao giờ bị nghẽn hạn ngạch."
        ));

        // BƯỚC 4: Purple
        listSteps.addView(createStepCard(
            4, "Bước 4: Thiết Lập Cài Đặt Ảnh Hưởng Chất Lượng", "#A855F7",
            "• Độ dài Glossary tối thiểu (2-4 ký tự): Lọc bỏ từ rác 1 chữ, chỉ lưu tên nhân vật và địa danh quan trọng.\n• Bật Chống Lọt Chữ Hán Nghiêm Ngặt (2 Lớp): Ép AI chuyển 100% sang tiếng Việt chuẩn, quét sạch chữ tượng hình.\n• Bật Tự Động Cứu Hộ Online: Tự động gửi lệnh dịch lại ngay nếu AI bị kẹt mạng hoặc dừng câu.",
            "Chính sách 'Giữ Cũ - Bỏ Mới' trong Tab Cài đặt giúp nhân vật không bao giờ bị đổi tên lộn xộn ở các chương sau."
        ));

        // BƯỚC 5: Cyan
        listSteps.addView(createStepCard(
            5, "Bước 5: Bắt Đầu Dịch & Xử Lý Khi Lọt Chương Thiếu", "#06B6D4",
            "• Bấm nút '▶ Dịch Range'. Quá trình dịch diễn ra hoàn toàn tự động.\n• NẾU BỊ SÓT CHƯƠNG HOẶC DỪNG GIỮA CHỪNG: Bạn chỉ cần bấm '⚡ Dịch Bù Chương Sót (Gap-Filling)'. App sẽ tự động kiểm tra, lướt qua những chương đã có và chỉ tập trung dịch các chương còn thiếu!",
            "Tính năng Gap-Filling giúp bạn không bao giờ phải lo lắng khi điện thoại mất mạng hay ứng dụng tạm ngắt."
        ));

        // BƯỚC 6: Rose
        listSteps.addView(createStepCard(
            6, "Bước 6: Làm Mượt Final & Xuất File Toàn Văn", "#F43F5E",
            "• Sau khi dịch xong toàn bộ các chương, bấm '✨ Làm Mượt Bản Dịch Final' để rà soát ngữ pháp và quét sạch chữ Hán sót lại.\n• Bấm '📥 Xuất Toàn Văn Tác Phẩm (.txt)' để lưu vào thư mục Download của điện thoại, sẵn sàng nạp vào máy đọc sách Kindle, Kobo hoặc app đọc truyện.",
            "File xuất ra định dạng UTF-8 chuẩn quốc tế, đọc mượt trên mọi thiết bị và ứng dụng."
        ));

        root.addView(listSteps);

        // FOOTER BUTTON
        Button btnStart = new Button(this);
        btnStart.setText("ĐÃ HIỂU - SẴN SÀNG DỊCH THUẬT");
        btnStart.setTextColor(Color.WHITE);
        btnStart.setTextSize(13);
        btnStart.setTypeface(null, Typeface.BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#2563EB"));
        btnBg.setCornerRadius(dp(16));
        btnStart.setBackground(btnBg);
        btnStart.setPadding(0, dp(14), 0, dp(14));
        btnStart.setOnClickListener(v -> dialog.dismiss());
        root.addView(btnStart);

        scroll.addView(root);
        dialog.setContentView(scroll);
        if (dialog.getWindow() != null) {
            int width = (int) (getResources().getDisplayMetrics().widthPixels * 0.94f);
            int height = (int) (getResources().getDisplayMetrics().heightPixels * 0.88f);
            dialog.getWindow().setLayout(width, height);
        }
        dialog.show();
    }

    private void showHelpTooltipDialog(String title, String whatIsIt, String howToUse, String proTip) {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        ScrollView scroll = new ScrollView(this);
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#18181B"));
        bg.setCornerRadius(dp(22));
        bg.setStroke(dp(1.5f), Color.parseColor("#3B82F6"));
        card.setBackground(bg);
        card.setPadding(dp(20), dp(20), dp(20), dp(20));

        // HEADER ROW
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(0, 0, 0, dp(14));

        TextView iconTv = new TextView(this);
        iconTv.setText("❓");
        iconTv.setTextSize(16);
        iconTv.setGravity(Gravity.CENTER);
        GradientDrawable iconBg = new GradientDrawable();
        iconBg.setColor(Color.parseColor("#1E1B4B"));
        iconBg.setCornerRadius(dp(12));
        iconBg.setStroke(dp(1), Color.parseColor("#6366F1"));
        iconTv.setBackground(iconBg);
        iconTv.setPadding(dp(8), dp(6), dp(8), dp(6));
        header.addView(iconTv);

        View spaceH = new View(this);
        header.addView(spaceH, new LinearLayout.LayoutParams(dp(10), 1));

        LinearLayout titleCol = new LinearLayout(this);
        titleCol.setOrientation(LinearLayout.VERTICAL);
        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(14);
        tvTitle.setTypeface(null, Typeface.BOLD);
        titleCol.addView(tvTitle);

        header.addView(titleCol, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView btnClose = new TextView(this);
        btnClose.setText("✕");
        btnClose.setTextColor(Color.parseColor("#9CA3AF"));
        btnClose.setTextSize(14);
        btnClose.setTypeface(null, Typeface.BOLD);
        btnClose.setGravity(Gravity.CENTER);
        GradientDrawable closeBg = new GradientDrawable();
        closeBg.setColor(Color.parseColor("#27272A"));
        closeBg.setCornerRadius(dp(20));
        btnClose.setBackground(closeBg);
        btnClose.setPadding(dp(10), dp(6), dp(10), dp(6));
        btnClose.setOnClickListener(v -> dialog.dismiss());
        header.addView(btnClose);

        card.addView(header);

        View div = new View(this);
        div.setBackgroundColor(Color.parseColor("#27272A"));
        card.addView(div, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));

        // SECTION 1: DÙNG ĐỂ LÀM GÌ
        LinearLayout sec1 = new LinearLayout(this);
        sec1.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable s1Bg = new GradientDrawable();
        s1Bg.setColor(Color.parseColor("#09090B"));
        s1Bg.setCornerRadius(dp(14));
        s1Bg.setStroke(dp(1), Color.parseColor("#27272A"));
        sec1.setBackground(s1Bg);
        sec1.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams lp1 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp1.setMargins(0, dp(14), 0, dp(10));
        sec1.setLayoutParams(lp1);

        TextView tvSec1Title = new TextView(this);
        tvSec1Title.setText("📌 TÍNH NĂNG NÀY DÙNG ĐỂ LÀM GÌ?");
        tvSec1Title.setTextColor(Color.parseColor("#60A5FA"));
        tvSec1Title.setTextSize(12);
        tvSec1Title.setTypeface(null, Typeface.BOLD);
        sec1.addView(tvSec1Title);

        TextView tvSec1Body = new TextView(this);
        tvSec1Body.setText(whatIsIt);
        tvSec1Body.setTextColor(Color.parseColor("#E4E4E7"));
        tvSec1Body.setTextSize(12);
        tvSec1Body.setLineSpacing(dp(2), 1.15f);
        tvSec1Body.setPadding(0, dp(6), 0, 0);
        sec1.addView(tvSec1Body);
        card.addView(sec1);

        // SECTION 2: CÁCH SỬ DỤNG TỐI ƯU
        LinearLayout sec2 = new LinearLayout(this);
        sec2.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable s2Bg = new GradientDrawable();
        s2Bg.setColor(Color.parseColor("#09090B"));
        s2Bg.setCornerRadius(dp(14));
        s2Bg.setStroke(dp(1), Color.parseColor("#27272A"));
        sec2.setBackground(s2Bg);
        sec2.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams lp2 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp2.setMargins(0, 0, 0, dp(10));
        sec2.setLayoutParams(lp2);

        TextView tvSec2Title = new TextView(this);
        tvSec2Title.setText("💡 CÁCH SỬ DỤNG TỐI ƯU:");
        tvSec2Title.setTextColor(Color.parseColor("#34D399"));
        tvSec2Title.setTextSize(12);
        tvSec2Title.setTypeface(null, Typeface.BOLD);
        sec2.addView(tvSec2Title);

        TextView tvSec2Body = new TextView(this);
        tvSec2Body.setText(howToUse);
        tvSec2Body.setTextColor(Color.parseColor("#D4D4D8"));
        tvSec2Body.setTextSize(12);
        tvSec2Body.setLineSpacing(dp(2), 1.15f);
        tvSec2Body.setPadding(0, dp(6), 0, 0);
        sec2.addView(tvSec2Body);
        card.addView(sec2);

        // SECTION 3: MẸO NHỎ (nếu có)
        if (proTip != null && !proTip.trim().isEmpty()) {
            LinearLayout sec3 = new LinearLayout(this);
            sec3.setOrientation(LinearLayout.VERTICAL);
            GradientDrawable s3Bg = new GradientDrawable();
            s3Bg.setColor(Color.parseColor("#271804"));
            s3Bg.setCornerRadius(dp(14));
            s3Bg.setStroke(dp(1), Color.parseColor("#D97706"));
            sec3.setBackground(s3Bg);
            sec3.setPadding(dp(14), dp(12), dp(14), dp(12));
            LinearLayout.LayoutParams lp3 = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp3.setMargins(0, 0, 0, dp(12));
            sec3.setLayoutParams(lp3);

            TextView tvSec3Title = new TextView(this);
            tvSec3Title.setText("✨ MẸO BỎ TÚI CỰC HAY:");
            tvSec3Title.setTextColor(Color.parseColor("#FBBF24"));
            tvSec3Title.setTextSize(12);
            tvSec3Title.setTypeface(null, Typeface.BOLD);
            sec3.addView(tvSec3Title);

            TextView tvSec3Body = new TextView(this);
            tvSec3Body.setText(proTip);
            tvSec3Body.setTextColor(Color.parseColor("#FEF3C7"));
            tvSec3Body.setTextSize(12);
            tvSec3Body.setLineSpacing(dp(2), 1.15f);
            tvSec3Body.setPadding(0, dp(6), 0, 0);
            sec3.addView(tvSec3Body);
            card.addView(sec3);
        }

        // FOOTER BUTTON: ĐÃ HIỂU
        Button btnDismiss = new Button(this);
        btnDismiss.setText("ĐÃ HIỂU");
        btnDismiss.setTextColor(Color.WHITE);
        btnDismiss.setTextSize(13);
        btnDismiss.setTypeface(null, Typeface.BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#2563EB"));
        btnBg.setCornerRadius(dp(14));
        btnDismiss.setBackground(btnBg);
        btnDismiss.setPadding(0, dp(12), 0, dp(12));
        btnDismiss.setOnClickListener(v -> dialog.dismiss());
        card.addView(btnDismiss);

        scroll.addView(card);
        dialog.setContentView(scroll);
        if (dialog.getWindow() != null) {
            int width = (int) (getResources().getDisplayMetrics().widthPixels * 0.92f);
            dialog.getWindow().setLayout(width, ViewGroup.LayoutParams.WRAP_CONTENT);
        }
        dialog.show();
    }

    private View createHelpButton(final String key) {
        initHelpMap();
        TextView tv = new TextView(this);
        tv.setText("?");
        tv.setTextColor(Color.parseColor("#60A5FA"));
        tv.setTextSize(12);
        tv.setTypeface(null, Typeface.BOLD);
        tv.setGravity(Gravity.CENTER);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#0F172A"));
        bg.setCornerRadius(dp(50));
        bg.setStroke(dp(1.5f), Color.parseColor("#3B82F6"));
        tv.setBackground(bg);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(26), dp(26));
        lp.leftMargin = dp(8);
        tv.setLayoutParams(lp);

        tv.setOnClickListener(v -> {
            HelpData item = helpMap.get(key);
            if (item != null) {
                showHelpTooltipDialog(item.title, item.whatIsIt, item.howToUse, item.proTip);
            } else {
                showHelpTooltipDialog("Hướng Dẫn", "Tính năng này giúp bạn quản lý và tối ưu quá trình dịch.", "Chạm vào các nút tương ứng để thao tác.", null);
            }
        });
        return tv;
    }

    private View createHelpButton(final String title, final String whatIsIt, final String howToUse, final String proTip) {
        TextView tv = new TextView(this);
        tv.setText("?");
        tv.setTextColor(Color.parseColor("#60A5FA"));
        tv.setTextSize(12);
        tv.setTypeface(null, Typeface.BOLD);
        tv.setGravity(Gravity.CENTER);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#0F172A"));
        bg.setCornerRadius(dp(50));
        bg.setStroke(dp(1.5f), Color.parseColor("#3B82F6"));
        tv.setBackground(bg);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(26), dp(26));
        lp.leftMargin = dp(8);
        tv.setLayoutParams(lp);

        tv.setOnClickListener(v -> showHelpTooltipDialog(title, whatIsIt, howToUse, proTip));
        return tv;
    }


    private static final int REQUEST_PICK_FILE = 1001;
    private static final int REQUEST_PICK_GLOSSARY_FILE = 1002;

    // Root FrameLayout chứa toàn bộ giao diện và Reader Overlay toàn màn hình
    private FrameLayout rootFrame;
    private LinearLayout mainContentLayout;

    // 4 Tab Views theo đúng thứ tự người dùng yêu cầu:
    // Tab 1: Key & Prompt
    // Tab 2: Dịch & Từ điển (Glossary)
    // Tab 3: Bản dịch & Đọc AMOLED/Sepia
    // Tab 4: Cài đặt & Trạng thái 5 tầng God-Mode
    private TabLayout tabLayout;
    private FrameLayout containerLayout;
    private ScrollView tabKeysView;
    private ScrollView tabTranslateView;
    private ScrollView tabReaderView;
    private ScrollView tabSettingsView;

    // Tab 4: Cài đặt chuyên sâu UI
    private TextView tvSettingsProjName;
    private TextView tvSettingsProjStats;
    private TextView tvSettingsMinTerm;
    private TextView tvSettingsMinFreq;
    private EditText edtCustomMinTerm;
    private EditText edtCustomMinFreq;
    private TextView tvSettingsTargetLang;
    private Button btnLangVi;
    private Button btnLangJa;
    private Button btnLangEn;
    private Button btnLangKo;
    private Button btnSettingsAntiHanzi;
    private Button btnSettingsAutoHeal;
    private Button btnSettingsPolicy;
    private final List<Button> minTermButtons = new ArrayList<>();
    private final List<Button> minFreqButtons = new ArrayList<>();

    // Quản lý Đa Dự Án (Multi-Project)
    private String currentProjectName = "Dai_Quan_Gia_Ma_Hoang";
    private final List<String> projectList = new ArrayList<>();
    private TextView tvCurrentProjectName;

    // Trạng thái ứng dụng
    private final List<ApiKeyItem> apiKeys = new ArrayList<>();
    private final Map<String, String> masterGlossary = new LinkedHashMap<>();
    private final List<PromptCardItem> promptCards = new ArrayList<>();
    private final List<String> rawChapters = new ArrayList<>();
    private final Map<Integer, String> translatedChapters = new HashMap<>();

    // Cài Đặt Chuyên Sâu (Deep Settings Hub)
    private int minTermLength = 2;
    private int minFrequency = 2;
    private String conflictPolicy = "keep-old";
    private boolean antiHanziStrict = true;
    private boolean autoHealOnlineEnabled = true;
    private String targetLanguage = "Tiếng Việt";
    private int cooldownSeconds = 60;
    private String rotationStrategy = "round-robin";
    private int contextSnippetLength = 350;

    private String currentModel = "gemini-2.5-flash";
    private String polishModel = "gemini-3.6-flash";
    private boolean isTranslating = false;
    private boolean isPaused = false;
    private boolean isPolishing = false;
    private int currentChapterIdx = 0;
    private int rangeFromChap = 1;
    private int rangeToChap = 1;
    private int delaySec = 2;
    private String loadedRawContent = "";
    private final LinkedList<String> logList = new LinkedList<>();
    private int chapterListPage = 0;
    private static final int CHAPTERS_PER_PAGE = 100;
    private GeminiEngine engine;
    private Handler mainHandler;
    private final Gson gson = new Gson();

    // Tab 1: Key & Prompt UI
    private LinearLayout llKeyList;
    private EditText edtNewKey;
    private TextView tvSelectedModel;
    private LinearLayout llPromptCards;

    // Tab 2: Dịch & Glossary UI
    private ProgressBar progressBar;
    private TextView tvProgressText;
    private EditText edtFromChap;
    private EditText edtToChap;
    private Button btnStartRange;
    private Button btnPauseResume;
    private Button btnCancelTrans;
    private Button btnFillGaps;
    private Button btnFillGapsTab3;
    private Button btnFinalPolish;
    private Button btnFinalPolishTab3;
    private boolean isGapFillingMode = false;
    private EditText edtRawText;
    private EditText edtChunkSize;
    private TextView tvGlossaryHeader;
    private LinearLayout llGlossaryList;
    private EditText edtGlossaryKey;
    private EditText edtGlossaryVal;
    private TextView tvLiveLogs;

    // Tab 3: Bản dịch & Đọc UI
    private LinearLayout llChapterList;
    private TextView tvChapterCountInfo;

    // =========================================================================
    // TRÌNH ĐỌC TOÀN MÀN HÌNH CHUYÊN NGHIỆP (AMOLED & SEPIA & SÁNG)
    // =========================================================================
    private FrameLayout flReaderOverlay;
    private LinearLayout llReaderRoot;
    private TextView tvReaderTitle;
    private TextView tvReaderSubTitle;
    private TextView tvReaderContent;
    private ScrollView svReaderScroll;
    private int readerCurrentChapterIndex = 0;
    private int readerFontSize = 16;
    private String readerTheme = "amoled"; // "amoled", "sepia", "light"
    private String readerMode = "translated"; // "translated", "bilingual", "original"
    private Button btnModeTrans;
    private Button btnModeBilingual;
    private Button btnModeRaw;
    private Button btnThemeAmoled;
    private Button btnThemeSepia;
    private Button btnThemeLight;
    private TextView tvFontSizeDisplay;
    private Button btnPrevChapter;
    private Button btnNextChapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mainHandler = new Handler(Looper.getMainLooper());

        // Kích hoạt bảo vệ Root nếu có
        if (RootController.isRootAvailable()) {
            RootController.applyGodModeKernelProtection();
        }

        loadAllState();
        engine = new GeminiEngine(apiKeys);
        initUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        saveAllState();
    }

    @Override
    protected void onStop() {
        super.onStop();
        saveAllState();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        saveAllState();
    }

    private void saveAllState() {
        try {
            SharedPreferences sp = getSharedPreferences("droid_prefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sp.edit();
            editor.putString("current_project_name", currentProjectName);
            editor.putString("current_model", currentModel);
            editor.putInt("delay_sec", delaySec);
            editor.putString("project_list", gson.toJson(projectList));
            editor.putString("api_keys", gson.toJson(apiKeys));
            editor.putString("prompt_cards", gson.toJson(promptCards));

            // Lưu cấu hình Cài Đặt Chuyên Sâu
            editor.putInt("min_term_length", minTermLength);
            editor.putInt("min_frequency", minFrequency);
            editor.putString("conflict_policy", conflictPolicy);
            editor.putBoolean("anti_hanzi_strict", antiHanziStrict);
            editor.putBoolean("auto_heal_online", autoHealOnlineEnabled);
            editor.putString("target_language", targetLanguage);
            editor.putString("polish_model", polishModel);
            editor.putInt("cooldown_seconds", cooldownSeconds);
            editor.putString("rotation_strategy", rotationStrategy);
            editor.putInt("context_snippet_len", contextSnippetLength);

            editor.apply();

            saveCurrentProjectData();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void saveCurrentProjectData() {
        try {
            if (currentProjectName == null || currentProjectName.trim().isEmpty()) return;
            java.io.File projectDir = new java.io.File(getFilesDir(), "projects");
            if (!projectDir.exists()) projectDir.mkdirs();

            java.io.File pFile = new java.io.File(projectDir, currentProjectName + ".json");
            JsonObject obj = new JsonObject();
            obj.addProperty("projectName", currentProjectName);
            obj.addProperty("currentChapterIdx", currentChapterIdx);
            obj.addProperty("loadedRawContent", loadedRawContent != null ? loadedRawContent : "");

            JsonArray rawArr = new JsonArray();
            for (String r : rawChapters) rawArr.add(r);
            obj.add("rawChapters", rawArr);

            JsonObject transObj = new JsonObject();
            for (Map.Entry<Integer, String> entry : translatedChapters.entrySet()) {
                transObj.addProperty(String.valueOf(entry.getKey()), entry.getValue());
            }
            obj.add("translatedChapters", transObj);

            JsonObject glossObj = new JsonObject();
            for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
                glossObj.addProperty(entry.getKey(), entry.getValue());
            }
            obj.add("masterGlossary", glossObj);

            java.io.FileOutputStream fos = new java.io.FileOutputStream(pFile);
            fos.write(obj.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos.flush();
            fos.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadCurrentProjectData(String name) {
        try {
            rawChapters.clear();
            translatedChapters.clear();
            masterGlossary.clear();
            loadedRawContent = "";
            currentChapterIdx = 0;

            java.io.File pFile = new java.io.File(new java.io.File(getFilesDir(), "projects"), name + ".json");
            if (pFile.exists()) {
                java.io.FileInputStream fis = new java.io.FileInputStream(pFile);
                byte[] data = new byte[(int) pFile.length()];
                fis.read(data);
                fis.close();
                String jsonStr = new String(data, java.nio.charset.StandardCharsets.UTF_8);
                JsonObject obj = gson.fromJson(jsonStr, JsonObject.class);
                if (obj != null) {
                    if (obj.has("currentChapterIdx")) currentChapterIdx = obj.get("currentChapterIdx").getAsInt();
                    if (obj.has("loadedRawContent")) loadedRawContent = obj.get("loadedRawContent").getAsString();

                    if (obj.has("rawChapters")) {
                        JsonArray arr = obj.getAsJsonArray("rawChapters");
                        for (int i = 0; i < arr.size(); i++) rawChapters.add(arr.get(i).getAsString());
                    }
                    if (obj.has("translatedChapters")) {
                        JsonObject tObj = obj.getAsJsonObject("translatedChapters");
                        for (String k : tObj.keySet()) {
                            translatedChapters.put(Integer.parseInt(k), tObj.get(k).getAsString());
                        }
                    }
                    if (obj.has("masterGlossary")) {
                        JsonObject gObj = obj.getAsJsonObject("masterGlossary");
                        for (String k : gObj.keySet()) {
                            masterGlossary.put(k, gObj.get(k).getAsString());
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadAllState() {
        SharedPreferences sp = getSharedPreferences("droid_prefs", Context.MODE_PRIVATE);
        boolean hasSaved = sp.contains("current_project_name");

        if (hasSaved) {
            currentProjectName = sp.getString("current_project_name", "Dai_Quan_Gia_Ma_Hoang");
            currentModel = sp.getString("current_model", "gemini-2.5-flash");
            delaySec = sp.getInt("delay_sec", 2);

            String pListJson = sp.getString("project_list", null);
            if (pListJson != null) {
                java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<ArrayList<String>>(){}.getType();
                List<String> list = gson.fromJson(pListJson, listType);
                if (list != null && !list.isEmpty()) {
                    projectList.clear();
                    projectList.addAll(list);
                }
            }

            String keysJson = sp.getString("api_keys", null);
            if (keysJson != null) {
                java.lang.reflect.Type keyType = new com.google.gson.reflect.TypeToken<ArrayList<ApiKeyItem>>(){}.getType();
                List<ApiKeyItem> kList = gson.fromJson(keysJson, keyType);
                if (kList != null && !kList.isEmpty()) {
                    apiKeys.clear();
                    apiKeys.addAll(kList);
                }
            }

            String promptsJson = sp.getString("prompt_cards", null);
            if (promptsJson != null) {
                java.lang.reflect.Type pType = new com.google.gson.reflect.TypeToken<ArrayList<PromptCardItem>>(){}.getType();
                List<PromptCardItem> pList = gson.fromJson(promptsJson, pType);
                if (pList != null && !pList.isEmpty()) {
                    promptCards.clear();
                    promptCards.addAll(pList);
                }
            }

            minTermLength = sp.getInt("min_term_length", 2);
            minFrequency = sp.getInt("min_frequency", 2);
            conflictPolicy = sp.getString("conflict_policy", "keep-old");
            antiHanziStrict = sp.getBoolean("anti_hanzi_strict", true);
            autoHealOnlineEnabled = sp.getBoolean("auto_heal_online", true);
            targetLanguage = sp.getString("target_language", "Tiếng Việt");
            polishModel = sp.getString("polish_model", "gemini-3.6-flash");
            cooldownSeconds = sp.getInt("cooldown_seconds", 60);
            rotationStrategy = sp.getString("rotation_strategy", "round-robin");
            contextSnippetLength = sp.getInt("context_snippet_len", 350);

            loadCurrentProjectData(currentProjectName);
        } else {
            initSampleData();
            saveAllState();
        }
    }

    private void initSampleData() {
        projectList.add("Dai_Quan_Gia_Ma_Hoang");
        projectList.add("Pham_Nhan_Tu_Tien");

        apiKeys.add(new ApiKeyItem("AIzaSyDemoSampleKeyNumberOneXYZ12345"));
        apiKeys.add(new ApiKeyItem("AIzaSyDemoSampleKeyNumberTwoABC67890"));

        masterGlossary.put("林辰", "Lâm Thần");
        masterGlossary.put("青云宗", "Thanh Vân Tông");
        masterGlossary.put("赵霸天", "Triệu Bá Thiên");
        masterGlossary.put("黑风寨", "Hắc Phong Trại");

        promptCards.add(new PromptCardItem(1, "Tiên Hiệp (Chuẩn mực)", "Dịch sang tiếng Việt tiểu thuyết tiên hiệp trôi chảy, đúng ngữ pháp. Động từ dịch nghĩa tự nhiên, không thô Hán-Việt. Xưng hô: hắn, nàng, ta, ngươi. Tên riêng giữ âm Hán-Việt.", true));
        promptCards.add(new PromptCardItem(2, "Đô Thị (Mượt mà)", "Dịch văn phong hiện đại đời thường mượt mà. Giữ nguyên tên nhân vật Hán-Việt.", false));
        promptCards.add(new PromptCardItem(3, "Huyền Huyễn / Sử Thi", "Dịch tiểu thuyết kỳ ảo, giữ nguyên thuật ngữ ma pháp, văn phong hào hùng.", false));

        String nl = String.valueOf((char) 10);
        rawChapters.add("第一章 少年与剑" + nl + "在偏僻的青石村中，有一位身负残破木剑的少年，名为林辰。" + nl + "林辰背着一把长剑，走在深邃的巷子里...");
        rawChapters.add("第二章 青云仙宗" + nl + "青云宗山门耸立在云海之巅，气势磅礴。" + nl + "数以千计的年轻才俊汇聚在巨大的演武广场上...");

        translatedChapters.put(0, "Chương 1: Thiếu Niên Và Kiếm" + nl + nl + "Tại thôn Thanh Thạch hẻo lánh, có một thiếu niên mang trên lưng thanh mộc kiếm tàn tạ, tên gọi Lâm Thần..." + nl);

        saveCurrentProjectData();

        // Khởi tạo sẵn tệp cho dự án mẫu số 2 để chuyển đổi dự án mượt mà
        try {
            java.io.File projectDir = new java.io.File(getFilesDir(), "projects");
            if (!projectDir.exists()) projectDir.mkdirs();
            java.io.File pFile2 = new java.io.File(projectDir, "Pham_Nhan_Tu_Tien.json");
            JsonObject obj2 = new JsonObject();
            obj2.addProperty("projectName", "Pham_Nhan_Tu_Tien");
            obj2.addProperty("currentChapterIdx", 0);
            obj2.addProperty("loadedRawContent", "");

            JsonArray rawArr2 = new JsonArray();
            rawArr2.add("第一章 山边小村" + nl + "二愣子睁大双眼，看着茅草屋顶，心中一片茫然。他本名韩立，因皮肤黝黑，村里人都唤他二愣子。" + nl + "韩立从床榻上爬起，走出屋外，清晨的山风夹杂着泥土的气息扑面而来。");
            rawArr2.add("第二章 七玄门试炼" + nl + "彩霞山七玄门，坐落于群山环抱之中，宛若仙境。" + nl + "数十名少年在岳堂主的带领下，站在险峻的落日峰前。");
            obj2.add("rawChapters", rawArr2);

            JsonObject transObj2 = new JsonObject();
            obj2.add("translatedChapters", transObj2);

            JsonObject glossObj2 = new JsonObject();
            glossObj2.addProperty("韩立", "Hàn Lập");
            glossObj2.addProperty("二愣子", "Nhị Lăng Tử");
            glossObj2.addProperty("七玄门", "Thất Huyền Môn");
            glossObj2.addProperty("彩霞山", "Thải Hà Sơn");
            obj2.add("masterGlossary", glossObj2);

            java.io.FileOutputStream fos2 = new java.io.FileOutputStream(pFile2);
            fos2.write(obj2.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos2.flush();
            fos2.close();
        } catch (Exception ignored) {}
    }

    private void initUI() {
        rootFrame = new FrameLayout(this);
        rootFrame.setBackgroundColor(Color.parseColor("#08090C"));

        mainContentLayout = new LinearLayout(this);
        mainContentLayout.setOrientation(LinearLayout.VERTICAL);

        // =====================================================================
        // HEADER 3 TẦNG SANG TRỌNG CHUẨN PIXEL-PERFECT (NHƯ BẢN PREVIEW)
        // =====================================================================
        LinearLayout headerRoot = new LinearLayout(this);
        headerRoot.setOrientation(LinearLayout.VERTICAL);
        headerRoot.setPadding(dp(16), dp(10), dp(16), dp(10));
        GradientDrawable hBg = new GradientDrawable();
        hBg.setColor(Color.parseColor("#0D0E15"));
        hBg.setStroke(dp(1), Color.parseColor("#171922"));
        headerRoot.setBackground(hBg);

        // TẦNG 1: SYSTEM STATUS BAR
        LinearLayout tier1 = new LinearLayout(this);
        tier1.setOrientation(LinearLayout.HORIZONTAL);
        tier1.setGravity(Gravity.CENTER_VERTICAL);
        tier1.setPadding(0, 0, 0, dp(6));

        TextView tvGodDot = new TextView(this);
        tvGodDot.setText("🟢 ");
        tvGodDot.setTextSize(10);
        tier1.addView(tvGodDot);

        TextView tvGodTitle = new TextView(this);
        tvGodTitle.setText("God-Mode: ");
        tvGodTitle.setTextColor(Color.parseColor("#FFFFFF"));
        tvGodTitle.setTextSize(11f);
        tvGodTitle.setTypeface(null, Typeface.BOLD);
        tier1.addView(tvGodTitle);

        TextView tvGodStatus = new TextView(this);
        tvGodStatus.setText("• Sẵn sàng");
        tvGodStatus.setTextColor(Color.parseColor("#94A3B8"));
        tvGodStatus.setTextSize(11f);
        tier1.addView(tvGodStatus, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvRootBadge = new TextView(this);
        tvRootBadge.setText("ROOT #");
        tvRootBadge.setTextColor(Color.parseColor("#F59E0B"));
        tvRootBadge.setTextSize(9.5f);
        tvRootBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvRootBadge.setPadding(dp(6), dp(2), dp(6), dp(2));
        GradientDrawable rBg = new GradientDrawable();
        rBg.setColor(Color.parseColor("#451A03"));
        rBg.setCornerRadius(dp(4));
        rBg.setStroke(dp(1), Color.parseColor("#D97706"));
        tvRootBadge.setBackground(rBg);
        tier1.addView(tvRootBadge);

        TextView tv5Layers = new TextView(this);
        tv5Layers.setText("5 Lớp");
        tv5Layers.setTextColor(Color.parseColor("#38BDF8"));
        tv5Layers.setTextSize(9.5f);
        tv5Layers.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tv5Layers.setPadding(dp(6), dp(2), dp(6), dp(2));
        GradientDrawable l5Bg = new GradientDrawable();
        l5Bg.setColor(Color.parseColor("#0C4A6E"));
        l5Bg.setCornerRadius(dp(4));
        l5Bg.setStroke(dp(1), Color.parseColor("#0284C7"));
        tv5Layers.setBackground(l5Bg);
        LinearLayout.LayoutParams l5lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        l5lp.leftMargin = dp(6);
        tier1.addView(tv5Layers, l5lp);

        headerRoot.addView(tier1);

        // TẦNG 2: BRAND LOCKUP & CORE BADGES
        LinearLayout tier2 = new LinearLayout(this);
        tier2.setOrientation(LinearLayout.HORIZONTAL);
        tier2.setGravity(Gravity.CENTER_VERTICAL);
        tier2.setPadding(0, dp(4), 0, dp(6));

        // App Icon Avatar Container
        FrameLayout iconAvatar = new FrameLayout(this);
        GradientDrawable iaBg = new GradientDrawable();
        iaBg.setColor(Color.parseColor("#171922"));
        iaBg.setCornerRadius(dp(8));
        iaBg.setStroke(dp(1), Color.parseColor("#10B981"));
        iconAvatar.setBackground(iaBg);
        iconAvatar.setPadding(dp(6), dp(6), dp(6), dp(6));
        TextView tvAvatarIcon = new TextView(this);
        tvAvatarIcon.setText("📖");
        tvAvatarIcon.setTextSize(14);
        tvAvatarIcon.setGravity(Gravity.CENTER);
        iconAvatar.addView(tvAvatarIcon, new FrameLayout.LayoutParams(dp(24), dp(24), Gravity.CENTER));
        tier2.addView(iconAvatar, new LinearLayout.LayoutParams(dp(36), dp(36)));

        // App Titles Column
        LinearLayout brandCol = new LinearLayout(this);
        brandCol.setOrientation(LinearLayout.VERTICAL);
        brandCol.setPadding(dp(8), 0, dp(8), 0);

        LinearLayout titleRow = new LinearLayout(this);
        titleRow.setOrientation(LinearLayout.HORIZONTAL);
        titleRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvTitleMain = new TextView(this);
        tvTitleMain.setText("Droid");
        tvTitleMain.setTextColor(Color.WHITE);
        tvTitleMain.setTextSize(15f);
        tvTitleMain.setTypeface(null, Typeface.BOLD);
        titleRow.addView(tvTitleMain);

        TextView tvTitleSub = new TextView(this);
        tvTitleSub.setText("Translator ");
        tvTitleSub.setTextColor(Color.parseColor("#10B981"));
        tvTitleSub.setTextSize(15f);
        tvTitleSub.setTypeface(null, Typeface.BOLD);
        titleRow.addView(tvTitleSub);

        TextView tvNativeBadge = new TextView(this);
        tvNativeBadge.setText("NATIVE");
        tvNativeBadge.setTextColor(Color.parseColor("#34D399"));
        tvNativeBadge.setTextSize(8.5f);
        tvNativeBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvNativeBadge.setPadding(dp(4), dp(1), dp(4), dp(1));
        GradientDrawable nbBg = new GradientDrawable();
        nbBg.setColor(Color.parseColor("#064E3B"));
        nbBg.setCornerRadius(dp(4));
        nbBg.setStroke(dp(1), Color.parseColor("#10B981"));
        tvNativeBadge.setBackground(nbBg);
        titleRow.addView(tvNativeBadge);
        brandCol.addView(titleRow);

        TextView tvSubEng = new TextView(this);
        tvSubEng.setText("Android 16 Kernel Engine");
        tvSubEng.setTextColor(Color.parseColor("#64748B"));
        tvSubEng.setTextSize(10f);
        brandCol.addView(tvSubEng);
        tier2.addView(brandCol, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        // Hướng dẫn Button
        Button btnHeaderHelp = new Button(this);
        btnHeaderHelp.setText("❓ Hướng Dẫn");
        btnHeaderHelp.setTextColor(Color.parseColor("#D1D5DB"));
        btnHeaderHelp.setTextSize(10.5f);
        btnHeaderHelp.setTypeface(null, Typeface.BOLD);
        btnHeaderHelp.setBackground(createButtonDrawable("#181A22", 14f));
        btnHeaderHelp.setPadding(dp(8), dp(4), dp(8), dp(4));
        btnHeaderHelp.setMinHeight(dp(30));
        btnHeaderHelp.setMinimumHeight(dp(30));
        btnHeaderHelp.setStateListAnimator(null);
        btnHeaderHelp.setOnClickListener(v -> {
            triggerHaptic();
            showHowToUseDialog();
        });
        tier2.addView(btnHeaderHelp);

        // OOM -1000 Badge
        TextView tvOomBadge = new TextView(this);
        tvOomBadge.setText("🛡️ OOM -1000");
        tvOomBadge.setTextColor(Color.parseColor("#34D399"));
        tvOomBadge.setTextSize(9.5f);
        tvOomBadge.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvOomBadge.setPadding(dp(6), dp(4), dp(6), dp(4));
        GradientDrawable oomBg = new GradientDrawable();
        oomBg.setColor(Color.parseColor("#064E3B"));
        oomBg.setCornerRadius(dp(6));
        oomBg.setStroke(dp(1), Color.parseColor("#10B981"));
        tvOomBadge.setBackground(oomBg);
        LinearLayout.LayoutParams olp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        olp.leftMargin = dp(6);
        tier2.addView(tvOomBadge, olp);

        headerRoot.addView(tier2);

        // TẦNG 3: TIẾN TRÌNH / DỰ ÁN SELECTOR
        LinearLayout tier3 = new LinearLayout(this);
        tier3.setOrientation(LinearLayout.HORIZONTAL);
        tier3.setGravity(Gravity.CENTER_VERTICAL);
        tier3.setPadding(0, dp(4), 0, 0);

        LinearLayout projPill = new LinearLayout(this);
        projPill.setOrientation(LinearLayout.HORIZONTAL);
        projPill.setGravity(Gravity.CENTER_VERTICAL);
        projPill.setPadding(dp(10), dp(6), dp(10), dp(6));
        GradientDrawable ppBg = new GradientDrawable();
        ppBg.setColor(Color.parseColor("#141620"));
        ppBg.setCornerRadius(dp(14));
        ppBg.setStroke(dp(1), Color.parseColor("#1E202E"));
        projPill.setBackground(ppBg);

        TextView tvPrIcon = new TextView(this);
        tvPrIcon.setText("📑 ");
        tvPrIcon.setTextSize(12);
        projPill.addView(tvPrIcon);

        TextView tvPrLabel = new TextView(this);
        tvPrLabel.setText("Tiến trình: ");
        tvPrLabel.setTextColor(Color.parseColor("#64748B"));
        tvPrLabel.setTextSize(11.5f);
        projPill.addView(tvPrLabel);

        tvCurrentProjectName = new TextView(this);
        tvCurrentProjectName.setText(currentProjectName + " ▾");
        tvCurrentProjectName.setTextColor(Color.parseColor("#38BDF8"));
        tvCurrentProjectName.setTextSize(11.5f);
        tvCurrentProjectName.setTypeface(null, Typeface.BOLD);
        projPill.addView(tvCurrentProjectName);

        projPill.setOnClickListener(v -> {
            triggerHaptic();
            showSwitchProjectDialog();
        });
        tier3.addView(projPill, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnNewProjTop = createButton("+ Tiến trình mới", "#1D4ED8");
        btnNewProjTop.setTextSize(11f);
        btnNewProjTop.setMinHeight(dp(32));
        btnNewProjTop.setPadding(dp(10), dp(4), dp(10), dp(4));
        LinearLayout.LayoutParams ntlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        ntlp.leftMargin = dp(8);
        btnNewProjTop.setLayoutParams(ntlp);
        btnNewProjTop.setOnClickListener(v -> {
            triggerHaptic();
            showNewProjectDialog();
        });
        tier3.addView(btnNewProjTop);

        headerRoot.addView(tier3);
        mainContentLayout.addView(headerRoot);

        // Container cho nội dung 4 Tab
        containerLayout = new FrameLayout(this);
        containerLayout.setBackgroundColor(Color.parseColor("#08090C"));
        LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f
        );
        mainContentLayout.addView(containerLayout, containerParams);

        // Khởi tạo 4 Tab View theo thứ tự
        createTabKeysView();        // Tab 1: Key & Prompt
        createTabTranslateView();   // Tab 2: Dịch & Glossary
        createTabReaderView();      // Tab 3: Bản dịch & Đọc
        createTabSettingsView();    // Tab 4: Cài đặt

        containerLayout.addView(tabKeysView);
        containerLayout.addView(tabTranslateView);
        containerLayout.addView(tabReaderView);
        containerLayout.addView(tabSettingsView);

        // =====================================================================
        // 2. BOTTOM NAVIGATION BAR - LUXURY GOLD/AMBER PILL (NHƯ PREVIEW)
        // =====================================================================
        LinearLayout bottomBarContainer = new LinearLayout(this);
        bottomBarContainer.setOrientation(LinearLayout.HORIZONTAL);
        bottomBarContainer.setGravity(Gravity.CENTER_VERTICAL);
        bottomBarContainer.setPadding(dp(4), dp(4), dp(4), dp(4));
        
        GradientDrawable barBg = new GradientDrawable();
        barBg.setColor(Color.parseColor("#0C0D13"));
        barBg.setCornerRadius(dp(22));
        barBg.setStroke(dp(1), Color.parseColor("#1A1C26"));
        bottomBarContainer.setBackground(barBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            bottomBarContainer.setElevation(dp(8));
        }

        LinearLayout.LayoutParams barLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(60)
        );
        barLp.setMargins(dp(12), dp(2), dp(12), dp(8));
        bottomBarContainer.setLayoutParams(barLp);

        final String[][] tabData = {
                {"🔑", "Key & Prompt"},
                {"⚡", "Dịch & Từ điển"},
                {"📖", "Bản dịch & Đọc"},
                {"⚙️", "Cài đặt"}
        };

        final List<LinearLayout> tabItemViews = new ArrayList<>();

        for (int i = 0; i < tabData.length; i++) {
            final int tabIdx = i;
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            item.setPadding(dp(2), dp(4), dp(2), dp(4));

            TextView icon = new TextView(this);
            icon.setText(tabData[i][0]);
            icon.setTextSize(15f);
            icon.setGravity(Gravity.CENTER);
            item.addView(icon);

            TextView label = new TextView(this);
            label.setText(tabData[i][1]);
            label.setTextSize(10f);
            label.setTypeface(null, Typeface.BOLD);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, dp(1), 0, 0);
            item.addView(label);

            item.setOnClickListener(v -> {
                triggerHaptic();
                switchTab(tabIdx);
                updateFloatingTabSelection(tabItemViews, tabIdx);
            });

            tabItemViews.add(item);
            bottomBarContainer.addView(item, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1.0f));
        }

        mainContentLayout.addView(bottomBarContainer);
        rootFrame.addView(mainContentLayout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // Khởi tạo Trình Đọc Toàn Màn Hình Overlay (mặc định GONE)
        createFullScreenReaderOverlay();
        rootFrame.addView(flReaderOverlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(rootFrame);

        // Mặc định mở Tab 1 (Key & Prompt)
        switchTab(0);
        updateFloatingTabSelection(tabItemViews, 0);
    }

    private void updateFloatingTabSelection(List<LinearLayout> tabItemViews, int selectedIdx) {
        for (int i = 0; i < tabItemViews.size(); i++) {
            LinearLayout item = tabItemViews.get(i);
            TextView icon = (TextView) item.getChildAt(0);
            TextView label = (TextView) item.getChildAt(1);
            boolean isSel = (i == selectedIdx);

            if (isSel) {
                GradientDrawable activeBg = new GradientDrawable();
                activeBg.setColor(Color.parseColor("#151720"));
                activeBg.setCornerRadius(dp(16));
                activeBg.setStroke(dp(1), Color.parseColor("#262938"));
                item.setBackground(activeBg);
                label.setTextColor(Color.parseColor("#F59E0B"));
            } else {
                item.setBackground(null);
                label.setTextColor(Color.parseColor("#64748B"));
            }
        }
    }

    private void switchTab(int index) {
        tabKeysView.setVisibility(index == 0 ? View.VISIBLE : View.GONE);
        tabTranslateView.setVisibility(index == 1 ? View.VISIBLE : View.GONE);
        tabReaderView.setVisibility(index == 2 ? View.VISIBLE : View.GONE);
        tabSettingsView.setVisibility(index == 3 ? View.VISIBLE : View.GONE);

        if (index == 0) {
            refreshKeyList();
            refreshPromptList();
        } else if (index == 1) {
            updateProgressUI();
            refreshGlossaryList();
        } else if (index == 2) {
            refreshChapterListView();
        } else if (index == 3) {
            refreshSettingsUI();
        }
    }

    // =========================================================================
    // THẺ 1: KEY & PROMPT
    // =========================================================================
    private void createTabKeysView() {
        tabKeysView = new ScrollView(this);
        tabKeysView.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(80));

        // BANNER HƯỚNG DẪN TỪ A-Z (GLOWING GLASS)
        LinearLayout bannerGuide = new LinearLayout(this);
        bannerGuide.setOrientation(LinearLayout.HORIZONTAL);
        bannerGuide.setGravity(Gravity.CENTER_VERTICAL);
        bannerGuide.setPadding(dp(14), dp(12), dp(14), dp(12));
        GradientDrawable bgBanner = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[]{
                Color.parseColor("#111C38"), Color.parseColor("#182852")
        });
        bgBanner.setCornerRadius(dp(16));
        bgBanner.setStroke(dp(1), Color.parseColor("#2563EB"));
        bannerGuide.setBackground(bgBanner);
        LinearLayout.LayoutParams bglp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bglp.setMargins(0, 0, 0, dp(14));
        bannerGuide.setLayoutParams(bglp);

        // Circular Question Icon Container
        FrameLayout qContainer = new FrameLayout(this);
        GradientDrawable qBg = new GradientDrawable();
        qBg.setColor(Color.parseColor("#1E3A8A"));
        qBg.setCornerRadius(dp(20));
        qContainer.setBackground(qBg);
        TextView tvQ = new TextView(this);
        tvQ.setText("?");
        tvQ.setTextColor(Color.parseColor("#60A5FA"));
        tvQ.setTextSize(13);
        tvQ.setTypeface(null, Typeface.BOLD);
        tvQ.setGravity(Gravity.CENTER);
        qContainer.addView(tvQ, new FrameLayout.LayoutParams(dp(28), dp(28), Gravity.CENTER));
        bannerGuide.addView(qContainer, new LinearLayout.LayoutParams(dp(28), dp(28)));

        LinearLayout guideTextCol = new LinearLayout(this);
        guideTextCol.setOrientation(LinearLayout.VERTICAL);
        guideTextCol.setPadding(dp(10), 0, dp(8), 0);

        LinearLayout gTitleRow = new LinearLayout(this);
        gTitleRow.setOrientation(LinearLayout.HORIZONTAL);
        gTitleRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvGuideTitle = new TextView(this);
        tvGuideTitle.setText("Cẩm Nang Hướng Dẫn Sử Dụng");
        tvGuideTitle.setTextColor(Color.WHITE);
        tvGuideTitle.setTextSize(13f);
        tvGuideTitle.setTypeface(null, Typeface.BOLD);
        gTitleRow.addView(tvGuideTitle);

        TextView tvAzTag = new TextView(this);
        tvAzTag.setText("Từ A-Z");
        tvAzTag.setTextColor(Color.parseColor("#93C5FD"));
        tvAzTag.setTextSize(9.5f);
        tvAzTag.setPadding(dp(4), dp(1), dp(4), dp(1));
        GradientDrawable azBg = new GradientDrawable();
        azBg.setColor(Color.parseColor("#1E3A8A"));
        azBg.setCornerRadius(dp(4));
        tvAzTag.setBackground(azBg);
        LinearLayout.LayoutParams azlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        azlp.leftMargin = dp(6);
        gTitleRow.addView(tvAzTag, azlp);
        guideTextCol.addView(gTitleRow);

        TextView tvGuideSub = new TextView(this);
        tvGuideSub.setText("Nhấn để xem cách lấy key, chọn model, dịch bù và xuất file");
        tvGuideSub.setTextColor(Color.parseColor("#93C5FD"));
        tvGuideSub.setTextSize(10.5f);
        guideTextCol.addView(tvGuideSub);

        bannerGuide.addView(guideTextCol, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvGuideArrow = new TextView(this);
        tvGuideArrow.setText("›");
        tvGuideArrow.setTextColor(Color.parseColor("#60A5FA"));
        tvGuideArrow.setTextSize(18);
        bannerGuide.addView(tvGuideArrow);

        bannerGuide.setOnClickListener(v -> {
            triggerHaptic();
            showHowToUseDialog();
        });
        content.addView(bannerGuide);

        // CARD 1: MULTI-KEY GEMINI POOL
        LinearLayout cardKeyPool = createCard();

        LinearLayout rowKeyHead = new LinearLayout(this);
        rowKeyHead.setOrientation(LinearLayout.HORIZONTAL);
        rowKeyHead.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvKeyIcon = new TextView(this);
        tvKeyIcon.setText("🗝️ ");
        tvKeyIcon.setTextSize(14);
        rowKeyHead.addView(tvKeyIcon);

        TextView tvKeyHead = new TextView(this);
        tvKeyHead.setText("Multi-Key Gemini Pool");
        tvKeyHead.setTextColor(Color.WHITE);
        tvKeyHead.setTextSize(14f);
        tvKeyHead.setTypeface(null, Typeface.BOLD);
        rowKeyHead.addView(tvKeyHead);
        rowKeyHead.addView(createHelpButton("key_pool"));

        View keySpacer = new View(this);
        rowKeyHead.addView(keySpacer, new LinearLayout.LayoutParams(0, 1, 1.0f));

        Button btnTestAll = createButton("⟳ Test tất cả key", "#3B2608");
        btnTestAll.setTextSize(10.5f);
        btnTestAll.setTextColor(Color.parseColor("#FBBF24"));
        btnTestAll.setMinHeight(dp(30));
        btnTestAll.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnTestAll.setOnClickListener(v -> {
            triggerHaptic();
            testAllKeys();
        });
        rowKeyHead.addView(btnTestAll);
        cardKeyPool.addView(rowKeyHead);

        edtNewKey = new EditText(this);
        edtNewKey.setHint("Dán Gemini API Key (Mỗi dòng 1 key)...");
        edtNewKey.setHintTextColor(Color.parseColor("#64748B"));
        edtNewKey.setTextColor(Color.WHITE);
        edtNewKey.setBackground(createInputDrawable());
        edtNewKey.setPadding(dp(12), dp(10), dp(12), dp(10));
        edtNewKey.setMinLines(2);
        edtNewKey.setTextSize(12.5f);
        LinearLayout.LayoutParams elp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        elp.setMargins(0, dp(10), 0, dp(10));
        edtNewKey.setLayoutParams(elp);
        cardKeyPool.addView(edtNewKey);

        Button btnAddKey = createGradientButton("+ Thêm API Key Vào Pool", Color.parseColor("#FF6B00"), Color.parseColor("#FFA100"));
        btnAddKey.setTextSize(12.5f);
        btnAddKey.setMinHeight(dp(44));
        btnAddKey.setOnClickListener(v -> {
            triggerHaptic();
            String k = edtNewKey.getText().toString().trim();
            if (!k.isEmpty()) {
                String nl = String.valueOf((char) 10);
                String[] lines = k.split(nl);
                int countAdded = 0;
                for (String line : lines) {
                    String single = line.trim().replace(String.valueOf((char) 34), "").replace(String.valueOf((char) 39), "");
                    if (single.length() >= 8 && !single.startsWith("#") && !single.startsWith("//")) {
                        boolean exists = false;
                        for (ApiKeyItem item : apiKeys) {
                            if (item.key.equals(single)) { exists = true; break; }
                        }
                        if (!exists) {
                            apiKeys.add(new ApiKeyItem(single));
                            countAdded++;
                        }
                    }
                }
                edtNewKey.setText("");
                refreshKeyList();
                Toast.makeText(this, "🎉 Đã nạp thành công " + countAdded + " Key vào Pool!", Toast.LENGTH_SHORT).show();
            }
        });
        cardKeyPool.addView(btnAddKey);

        llKeyList = new LinearLayout(this);
        llKeyList.setOrientation(LinearLayout.VERTICAL);
        llKeyList.setPadding(0, dp(10), 0, dp(2));
        cardKeyPool.addView(llKeyList);
        content.addView(cardKeyPool);

        // CARD 2: CHỌN DÒNG MODEL GEMINI
        LinearLayout cardModel = createCard();

        LinearLayout rowMHead = new LinearLayout(this);
        rowMHead.setOrientation(LinearLayout.HORIZONTAL);
        rowMHead.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvMIcon = new TextView(this);
        tvMIcon.setText("✨ ");
        tvMIcon.setTextSize(14);
        rowMHead.addView(tvMIcon);

        TextView tvModelHead = new TextView(this);
        tvModelHead.setText("Chọn Dòng Model Gemini");
        tvModelHead.setTextColor(Color.WHITE);
        tvModelHead.setTextSize(14f);
        tvModelHead.setTypeface(null, Typeface.BOLD);
        rowMHead.addView(tvModelHead);
        rowMHead.addView(createHelpButton("select_model"));

        View mSpacer = new View(this);
        rowMHead.addView(mSpacer, new LinearLayout.LayoutParams(0, 1, 1.0f));

        tvSelectedModel = new TextView(this);
        tvSelectedModel.setText(currentModel);
        tvSelectedModel.setTextColor(Color.parseColor("#38BDF8"));
        tvSelectedModel.setTextSize(11f);
        tvSelectedModel.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvSelectedModel.setPadding(dp(8), dp(3), dp(8), dp(3));
        GradientDrawable smBg = new GradientDrawable();
        smBg.setColor(Color.parseColor("#0C4A6E"));
        smBg.setCornerRadius(dp(6));
        smBg.setStroke(dp(1), Color.parseColor("#0284C7"));
        tvSelectedModel.setBackground(smBg);
        rowMHead.addView(tvSelectedModel);
        cardModel.addView(rowMHead);

        // Danh sách thẻ Model chọn
        final String[][] modelList = {
                {"gemini-3.6-flash", "3.6 Flash", "Model Siêu Cấp 2026", "Chuyên gia xử lý Hán Việt & Làm mượt toàn văn tuyệt đối"},
                {"gemini-2.5-flash", "2.5 Flash", "Mặc định - Siêu tốc", "Cân bằng tốc độ và độ mượt văn phong"},
                {"gemini-2.5-flash-lite", "2.5 Flash Lite", "Tiết kiệm Quota", "Rất nhanh, ít tốn RPM/TPM"},
                {"gemini-2.5-pro", "2.5 Pro", "Chuyên sâu", "Dành cho chương văn học phức tạp cần lập luận sâu"}
        };

        final List<LinearLayout> modelCardsViews = new ArrayList<>();

        for (String[] mInfo : modelList) {
            final String mId = mInfo[0];
            final String mTitle = mInfo[1];
            final String mTag = mInfo[2];
            final String mDesc = mInfo[3];

            LinearLayout mCard = new LinearLayout(this);
            mCard.setOrientation(LinearLayout.VERTICAL);
            mCard.setPadding(dp(12), dp(10), dp(12), dp(10));
            LinearLayout.LayoutParams mclp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            mclp.setMargins(0, dp(6), 0, 0);
            mCard.setLayoutParams(mclp);

            LinearLayout mRowTop = new LinearLayout(this);
            mRowTop.setOrientation(LinearLayout.HORIZONTAL);
            mRowTop.setGravity(Gravity.CENTER_VERTICAL);

            TextView tvName = new TextView(this);
            tvName.setText(mTitle);
            tvName.setTextColor(Color.WHITE);
            tvName.setTextSize(13f);
            tvName.setTypeface(null, Typeface.BOLD);
            mRowTop.addView(tvName);

            TextView tvTag = new TextView(this);
            tvTag.setText(mTag);
            tvTag.setTextColor(Color.parseColor("#94A3B8"));
            tvTag.setTextSize(9.5f);
            tvTag.setPadding(dp(5), dp(1), dp(5), dp(1));
            GradientDrawable tagBg = new GradientDrawable();
            tagBg.setColor(Color.parseColor("#1C1E2A"));
            tagBg.setCornerRadius(dp(4));
            tvTag.setBackground(tagBg);
            LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            tlp.leftMargin = dp(6);
            mRowTop.addView(tvTag, tlp);

            mCard.addView(mRowTop);

            TextView tvDesc = new TextView(this);
            tvDesc.setText(mDesc);
            tvDesc.setTextColor(Color.parseColor("#64748B"));
            tvDesc.setTextSize(10.5f);
            tvDesc.setPadding(0, dp(3), 0, 0);
            mCard.addView(tvDesc);

            mCard.setOnClickListener(v -> {
                triggerHaptic();
                currentModel = mId;
                tvSelectedModel.setText(currentModel);
                updateModelCardsSelection(modelCardsViews, modelList, currentModel);
                Toast.makeText(this, "Đã chọn: " + mTitle, Toast.LENGTH_SHORT).show();
            });

            modelCardsViews.add(mCard);
            cardModel.addView(mCard);
        }

        updateModelCardsSelection(modelCardsViews, modelList, currentModel);

        // Custom Model ID Input
        LinearLayout rowCustom = new LinearLayout(this);
        rowCustom.setOrientation(LinearLayout.HORIZONTAL);
        rowCustom.setGravity(Gravity.CENTER_VERTICAL);
        rowCustom.setPadding(0, dp(10), 0, 0);

        EditText edtCustomModel = new EditText(this);
        edtCustomModel.setHint("Model tùy biến (VD: gemini-3.5-flash)...");
        edtCustomModel.setHintTextColor(Color.parseColor("#64748B"));
        edtCustomModel.setTextColor(Color.WHITE);
        edtCustomModel.setBackground(createInputDrawable());
        edtCustomModel.setPadding(dp(10), dp(8), dp(10), dp(8));
        edtCustomModel.setTextSize(11.5f);
        rowCustom.addView(edtCustomModel, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnSetCustom = createButton("Dùng", "#1D4ED8");
        btnSetCustom.setTextSize(11f);
        btnSetCustom.setMinHeight(dp(36));
        btnSetCustom.setPadding(dp(10), dp(4), dp(10), dp(4));
        LinearLayout.LayoutParams bclp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bclp.leftMargin = dp(6);
        btnSetCustom.setLayoutParams(bclp);
        btnSetCustom.setOnClickListener(v -> {
            triggerHaptic();
            String cm = edtCustomModel.getText().toString().trim();
            if (!cm.isEmpty()) {
                currentModel = cm;
                tvSelectedModel.setText(currentModel);
                Toast.makeText(this, "Đã kích hoạt model: " + cm, Toast.LENGTH_SHORT).show();
            }
        });
        rowCustom.addView(btnSetCustom);
        cardModel.addView(rowCustom);
        content.addView(cardModel);

        // CARD 3: THẺ PROMPT PHONG CÁCH
        LinearLayout cardPrompt = createCard();

        LinearLayout promptHeaderRow = new LinearLayout(this);
        promptHeaderRow.setOrientation(LinearLayout.HORIZONTAL);
        promptHeaderRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvPrIcon = new TextView(this);
        tvPrIcon.setText("🎭 ");
        tvPrIcon.setTextSize(14);
        promptHeaderRow.addView(tvPrIcon);

        TextView tvPromptHead = new TextView(this);
        tvPromptHead.setText("Thẻ Phong Cách Dịch");
        tvPromptHead.setTextColor(Color.WHITE);
        tvPromptHead.setTextSize(14f);
        tvPromptHead.setTypeface(null, Typeface.BOLD);
        promptHeaderRow.addView(tvPromptHead);
        promptHeaderRow.addView(createHelpButton("prompt_cards"));

        View promptSpacer = new View(this);
        promptHeaderRow.addView(promptSpacer, new LinearLayout.LayoutParams(0, 1, 1.0f));

        Button btnAddPrompt = createButton("+ Thêm", "#1A1C28");
        btnAddPrompt.setTextSize(10.5f);
        btnAddPrompt.setMinHeight(dp(30));
        btnAddPrompt.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnAddPrompt.setOnClickListener(v -> {
            triggerHaptic();
            showPromptDialog(null);
        });
        promptHeaderRow.addView(btnAddPrompt);
        cardPrompt.addView(promptHeaderRow);

        llPromptCards = new LinearLayout(this);
        llPromptCards.setOrientation(LinearLayout.VERTICAL);
        llPromptCards.setPadding(0, dp(8), 0, 0);
        cardPrompt.addView(llPromptCards);
        content.addView(cardPrompt);

        tabKeysView.addView(content);
        refreshKeyList();
        refreshPromptList();
    }

    private void updateModelCardsSelection(List<LinearLayout> modelCardsViews, String[][] modelList, String selectedModel) {
        for (int i = 0; i < modelCardsViews.size(); i++) {
            LinearLayout card = modelCardsViews.get(i);
            boolean isSel = modelList[i][0].equals(selectedModel);
            GradientDrawable cBg = new GradientDrawable();
            cBg.setColor(Color.parseColor(isSel ? "#182234" : "#151720"));
            cBg.setCornerRadius(dp(12));
            cBg.setStroke(dp(1), Color.parseColor(isSel ? "#0284C7" : "#1E202E"));
            card.setBackground(cBg);
        }
    }

    private void testAllKeys() {
        Toast.makeText(this, "Đang kiểm tra " + apiKeys.size() + " API Key...", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            for (ApiKeyItem item : apiKeys) {
                engine.testKey(item);
                mainHandler.post(this::refreshKeyList);
            }
            mainHandler.post(() -> Toast.makeText(MainActivity.this, "🎉 Đã hoàn tất kiểm tra Key Pool!", Toast.LENGTH_SHORT).show());
        }).start();
    }

    private void refreshKeyList() {
        llKeyList.removeAllViews();
        for (int i = 0; i < apiKeys.size(); i++) {
            final int idx = i;
            ApiKeyItem item = apiKeys.get(idx);

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(dp(10), dp(8), dp(10), dp(8));
            row.setGravity(Gravity.CENTER_VERTICAL);
            GradientDrawable rowBg = new GradientDrawable();
            rowBg.setColor(Color.parseColor("#151720"));
            rowBg.setCornerRadius(dp(10));
            rowBg.setStroke(dp(1), Color.parseColor("#1F2230"));
            row.setBackground(rowBg);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, dp(6));
            row.setLayoutParams(lp);

            TextView tvIdx = new TextView(this);
            tvIdx.setText(String.valueOf(idx + 1));
            tvIdx.setTextColor(Color.parseColor("#94A3B8"));
            tvIdx.setTextSize(11f);
            tvIdx.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            tvIdx.setGravity(Gravity.CENTER);
            GradientDrawable idBg = new GradientDrawable();
            idBg.setColor(Color.parseColor("#1C1E2A"));
            idBg.setCornerRadius(dp(6));
            tvIdx.setBackground(idBg);
            LinearLayout.LayoutParams idlp = new LinearLayout.LayoutParams(dp(22), dp(22));
            idlp.rightMargin = dp(8);
            tvIdx.setLayoutParams(idlp);
            row.addView(tvIdx);

            TextView tvK = new TextView(this);
            String masked = item.key.length() > 8 ? ". . ." + item.key.substring(item.key.length() - 8) : item.key;
            tvK.setText(masked);
            tvK.setTextColor(Color.WHITE);
            tvK.setTextSize(12f);
            tvK.setTypeface(Typeface.MONOSPACE);
            tvK.setSingleLine(true);
            tvK.setEllipsize(android.text.TextUtils.TruncateAt.END);
            row.addView(tvK, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            TextView tvStatus = new TextView(this);
            boolean isActive = "ACTIVE".equalsIgnoreCase(item.state);
            tvStatus.setText(isActive ? "ACTIVE" : item.state);
            tvStatus.setTextColor(Color.parseColor(isActive ? "#10B981" : "#EF4444"));
            tvStatus.setTextSize(9.5f);
            tvStatus.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            tvStatus.setPadding(dp(6), dp(2), dp(6), dp(2));
            GradientDrawable stBg = new GradientDrawable();
            stBg.setColor(Color.parseColor(isActive ? "#064E3B" : "#450A0A"));
            stBg.setCornerRadius(dp(4));
            stBg.setStroke(dp(1), Color.parseColor(isActive ? "#10B981" : "#EF4444"));
            tvStatus.setBackground(stBg);
            row.addView(tvStatus);

            Button btnTest = createButton("⟳ Test", "#1A1C28");
            btnTest.setTextSize(10.5f);
            btnTest.setMinHeight(dp(28));
            btnTest.setPadding(dp(8), dp(2), dp(8), dp(2));
            btnTest.setTextColor(Color.parseColor("#E2E8F0"));
            LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(28));
            tlp.leftMargin = dp(6);
            btnTest.setLayoutParams(tlp);
            btnTest.setOnClickListener(v -> {
                triggerHaptic();
                btnTest.setText("...");
                new Thread(() -> {
                    boolean ok = engine.testKey(item);
                    mainHandler.post(() -> {
                        btnTest.setText("⟳ Test");
                        refreshKeyList();
                        Toast.makeText(MainActivity.this, ok ? "✅ Key hoạt động tốt!" : "❌ Key lỗi hoặc hết hạn!", Toast.LENGTH_SHORT).show();
                    });
                }).start();
            });
            row.addView(btnTest);

            Button btnDel = createButton("🗑", "#1A1C28");
            btnDel.setTextSize(11f);
            btnDel.setMinHeight(dp(28));
            btnDel.setPadding(dp(6), dp(2), dp(6), dp(2));
            btnDel.setTextColor(Color.parseColor("#EF4444"));
            LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(dp(28), dp(28));
            dlp.leftMargin = dp(6);
            btnDel.setLayoutParams(dlp);
            btnDel.setOnClickListener(v -> {
                triggerHaptic();
                apiKeys.remove(idx);
                refreshKeyList();
            });
            row.addView(btnDel);

            llKeyList.addView(row);
        }
    }

    private void showPromptDialog(PromptCardItem editingItem) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(editingItem != null ? "Sửa Thẻ Prompt" : "Thêm Thẻ Prompt Mới");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32, 24, 32, 24);

        TextView tvTitleLabel = new TextView(this);
        tvTitleLabel.setText("Tiêu đề phong cách:");
        layout.addView(tvTitleLabel);

        EditText edtTitle = new EditText(this);
        edtTitle.setText(editingItem != null ? editingItem.title : "");
        layout.addView(edtTitle);

        TextView tvContentLabel = new TextView(this);
        tvContentLabel.setText("Nội dung System Prompt:");
        tvContentLabel.setPadding(0, 16, 0, 0);
        layout.addView(tvContentLabel);

        EditText edtContent = new EditText(this);
        edtContent.setLines(4);
        edtContent.setText(editingItem != null ? editingItem.content : "");
        layout.addView(edtContent);

        builder.setView(layout);

        builder.setPositiveButton("Lưu", (dialog, which) -> {
            String t = edtTitle.getText().toString().trim();
            String c = edtContent.getText().toString().trim();
            if (!t.isEmpty() && !c.isEmpty()) {
                if (editingItem != null) {
                    editingItem.title = t;
                    editingItem.content = c;
                } else {
                    for (PromptCardItem p : promptCards) p.active = false;
                    promptCards.add(new PromptCardItem(System.currentTimeMillis(), t, c, true));
                }
                refreshPromptList();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void refreshPromptList() {
        llPromptCards.removeAllViews();
        for (PromptCardItem p : promptCards) {
            LinearLayout c = createCard();
            GradientDrawable promptBg = new GradientDrawable();
            promptBg.setColor(Color.parseColor(p.active ? "#1E293B" : "#161B22"));
            promptBg.setCornerRadius(22f);
            promptBg.setStroke(p.active ? 3 : 1, Color.parseColor(p.active ? "#3B82F6" : "#30363D"));
            c.setBackground(promptBg);

            LinearLayout topRow = new LinearLayout(this);
            topRow.setOrientation(LinearLayout.HORIZONTAL);
            topRow.setGravity(Gravity.CENTER_VERTICAL);

            TextView t = new TextView(this);
            t.setText(p.title + (p.active ? " (Đang dùng)" : ""));
            t.setTextColor(Color.parseColor(p.active ? "#60A5FA" : "#FFFFFF"));
            t.setTypeface(null, Typeface.BOLD);
            topRow.addView(t, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            Button btnEdit = createButton("Sửa", "#374151");
            btnEdit.setOnClickListener(v -> showPromptDialog(p));
            topRow.addView(btnEdit);

            View sp1 = new View(this);
            topRow.addView(sp1, new LinearLayout.LayoutParams(8, 1));

            Button btnDel = createButton("Xóa", "#7F1D1D");
            btnDel.setOnClickListener(v -> {
                if (promptCards.size() <= 1) {
                    Toast.makeText(this, "Phải giữ lại ít nhất 1 thẻ Prompt!", Toast.LENGTH_SHORT).show();
                    return;
                }
                promptCards.remove(p);
                if (!promptCards.stream().anyMatch(item -> item.active)) {
                    promptCards.get(0).active = true;
                }
                refreshPromptList();
                Toast.makeText(this, "Đã xóa thẻ prompt!", Toast.LENGTH_SHORT).show();
            });
            topRow.addView(btnDel);

            c.addView(topRow);

            TextView cnt = new TextView(this);
            cnt.setText(p.content);
            cnt.setTextColor(Color.parseColor("#9CA3AF"));
            cnt.setTextSize(12);
            cnt.setPadding(0, 8, 0, 0);
            c.addView(cnt);

            c.setOnClickListener(v -> {
                for (PromptCardItem other : promptCards) other.active = (other.id == p.id);
                refreshPromptList();
                Toast.makeText(this, "Đã chọn phong cách: " + p.title, Toast.LENGTH_SHORT).show();
            });

            llPromptCards.addView(c);
        }
    }

    // =========================================================================
    // THẺ 2: DỊCH & TỪ ĐIỂN GLOSSARY
    // =========================================================================
    private void createTabTranslateView() {
        tabTranslateView = new ScrollView(this);
        tabTranslateView.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(80));

        // =====================================================================
        // MỤC 1: NHẬP & BÓC TÁCH FILE TRUYỆN GỐC (Card 1)
        // =====================================================================
        LinearLayout cardInput = createCard();

        LinearLayout rowInputHeader = new LinearLayout(this);
        rowInputHeader.setOrientation(LinearLayout.HORIZONTAL);
        rowInputHeader.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvInpIcon = new TextView(this);
        tvInpIcon.setText("📂 ");
        tvInpIcon.setTextSize(15);
        rowInputHeader.addView(tvInpIcon);

        TextView tvInputTitle = new TextView(this);
        tvInputTitle.setText("Nhập & Bóc Tách File Truyện Gốc");
        tvInputTitle.setTextColor(Color.WHITE);
        tvInputTitle.setTextSize(14.5f);
        tvInputTitle.setTypeface(null, Typeface.BOLD);
        rowInputHeader.addView(tvInputTitle);
        rowInputHeader.addView(createHelpButton("novel_raw_input"));

        View spInp = new View(this);
        rowInputHeader.addView(spInp, new LinearLayout.LayoutParams(0, 1, 1.0f));
        cardInput.addView(rowInputHeader);

        // Quản lý Dự Án Truyện (Multi-Project Switcher)
        LinearLayout rowProjHeader = new LinearLayout(this);
        rowProjHeader.setOrientation(LinearLayout.HORIZONTAL);
        rowProjHeader.setGravity(Gravity.CENTER_VERTICAL);
        rowProjHeader.setPadding(0, dp(12), 0, dp(10));

        tvCurrentProjectName = new TextView(this);
        tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
        tvCurrentProjectName.setTextColor(Color.parseColor("#38BDF8"));
        tvCurrentProjectName.setTextSize(13f);
        tvCurrentProjectName.setTypeface(null, Typeface.BOLD);
        rowProjHeader.addView(tvCurrentProjectName, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnSwitchProj = createButton("Đổi Truyện", "#1E293B");
        btnSwitchProj.setTextSize(11f);
        btnSwitchProj.setMinHeight(dp(36));
        btnSwitchProj.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnSwitchProj.setOnClickListener(v -> {
            triggerHaptic();
            showSwitchProjectDialog();
        });
        rowProjHeader.addView(btnSwitchProj);

        Button btnNewProj = createButton("+ Dự Án Mới", "#1D4ED8");
        btnNewProj.setTextSize(11f);
        btnNewProj.setMinHeight(dp(36));
        btnNewProj.setPadding(dp(10), dp(4), dp(10), dp(4));
        LinearLayout.LayoutParams nplp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        nplp.leftMargin = dp(6);
        btnNewProj.setLayoutParams(nplp);
        btnNewProj.setOnClickListener(v -> {
            triggerHaptic();
            showNewProjectDialog();
        });
        rowProjHeader.addView(btnNewProj);

        cardInput.addView(rowProjHeader);

        // Nạp văn bản truyện thô
        edtRawText = new EditText(this);
        edtRawText.setTextColor(Color.WHITE);
        edtRawText.setBackground(createInputDrawable());
        edtRawText.setPadding(dp(14), dp(12), dp(14), dp(12));
        edtRawText.setHint("Dán truyện hoặc bấm Chọn File .txt...");
        edtRawText.setHintTextColor(Color.parseColor("#64748B"));
        edtRawText.setLines(3);
        edtRawText.setTextSize(13f);
        cardInput.addView(edtRawText);

        // Nút Chọn file từ bộ nhớ
        Button btnPickFile = createButton("📁 CHỌN FILE .TXT / .EPUB TỪ BỘ NHỚ", "#1E293B");
        btnPickFile.setMinHeight(dp(44));
        btnPickFile.setTextSize(12.5f);
        LinearLayout.LayoutParams pflp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        pflp.setMargins(0, dp(10), 0, 0);
        btnPickFile.setLayoutParams(pflp);
        btnPickFile.setOnClickListener(v -> {
            triggerHaptic();
            openFilePicker();
        });
        cardInput.addView(btnPickFile);

        // Hàng tách chương: Tách Tác Giả (Regex) vs Tách Theo Ký Tự
        LinearLayout splitOptRow = new LinearLayout(this);
        splitOptRow.setOrientation(LinearLayout.HORIZONTAL);
        splitOptRow.setPadding(0, dp(10), 0, 0);
        splitOptRow.setGravity(Gravity.CENTER_VERTICAL);

        Button btnSplitAuthor = createButton("TÁCH TÁC GIẢ (REGEX)", "#065F46");
        btnSplitAuthor.setTextSize(11f);
        btnSplitAuthor.setMinHeight(dp(40));
        btnSplitAuthor.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnSplitAuthor.setOnClickListener(v -> {
            triggerHaptic();
            splitRawText(false);
        });
        splitOptRow.addView(btnSplitAuthor, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f));

        edtChunkSize = new EditText(this);
        edtChunkSize.setText("3500");
        edtChunkSize.setTextColor(Color.WHITE);
        edtChunkSize.setBackground(createInputDrawable());
        edtChunkSize.setPadding(dp(8), dp(6), dp(8), dp(6));
        edtChunkSize.setHint("Ký tự");
        edtChunkSize.setGravity(Gravity.CENTER);
        edtChunkSize.setTextSize(12f);
        LinearLayout.LayoutParams cslp = new LinearLayout.LayoutParams(dp(70), ViewGroup.LayoutParams.WRAP_CONTENT);
        cslp.setMargins(dp(6), 0, dp(6), 0);
        edtChunkSize.setLayoutParams(cslp);
        splitOptRow.addView(edtChunkSize);

        Button btnSplitChars = createButton("TÁCH THEO KÝ TỰ", "#0369A1");
        btnSplitChars.setTextSize(11f);
        btnSplitChars.setMinHeight(dp(40));
        btnSplitChars.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnSplitChars.setOnClickListener(v -> {
            triggerHaptic();
            splitRawText(true);
        });
        splitOptRow.addView(btnSplitChars, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardInput.addView(splitOptRow);
        content.addView(cardInput);

        // =====================================================================
        // MỤC 2: TIẾN ĐỘ DỊCH THUẬT & ĐIỀU KHIỂN (Card 2)
        // =====================================================================
        LinearLayout cardProgress = createCard();

        LinearLayout rowProgHead = new LinearLayout(this);
        rowProgHead.setOrientation(LinearLayout.HORIZONTAL);
        rowProgHead.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvPrgIcon = new TextView(this);
        tvPrgIcon.setText("⚡ ");
        tvPrgIcon.setTextSize(15);
        rowProgHead.addView(tvPrgIcon);

        TextView tvProgTitle = new TextView(this);
        tvProgTitle.setText("Tiến Độ Dịch Thuật & Điều Khiển");
        tvProgTitle.setTextColor(Color.WHITE);
        tvProgTitle.setTextSize(14.5f);
        tvProgTitle.setTypeface(null, Typeface.BOLD);
        rowProgHead.addView(tvProgTitle);
        rowProgHead.addView(createHelpButton("range_progress"));

        View spProg = new View(this);
        rowProgHead.addView(spProg, new LinearLayout.LayoutParams(0, 1, 1.0f));
        cardProgress.addView(rowProgHead);

        tvProgressText = new TextView(this);
        tvProgressText.setTextColor(Color.parseColor("#38BDF8"));
        tvProgressText.setTextSize(13.5f);
        tvProgressText.setTypeface(null, Typeface.BOLD);
        tvProgressText.setPadding(0, dp(10), 0, dp(6));
        tvProgressText.setText("Tiến độ: " + translatedChapters.size() + " / " + rawChapters.size() + " chương");
        cardProgress.addView(tvProgressText);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(Math.max(rawChapters.size(), 1));
        progressBar.setProgress(translatedChapters.size());
        progressBar.setProgressTintList(android.content.res.ColorStateList.valueOf(Color.parseColor("#10B981")));
        progressBar.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.parseColor("#1E293B")));
        progressBar.setMinimumHeight(dp(10));
        cardProgress.addView(progressBar);

        // Range inputs: Từ chương -> Đến chương
        LinearLayout rangeRow = new LinearLayout(this);
        rangeRow.setOrientation(LinearLayout.HORIZONTAL);
        rangeRow.setPadding(0, dp(12), 0, dp(8));
        rangeRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvF = new TextView(this);
        tvF.setText("Từ chương: ");
        tvF.setTextColor(Color.parseColor("#94A3B8"));
        tvF.setTextSize(12.5f);
        rangeRow.addView(tvF);

        edtFromChap = new EditText(this);
        edtFromChap.setText("1");
        edtFromChap.setTextColor(Color.WHITE);
        edtFromChap.setBackground(createInputDrawable());
        edtFromChap.setPadding(dp(12), dp(8), dp(12), dp(8));
        edtFromChap.setTextSize(13f);
        edtFromChap.setGravity(Gravity.CENTER);
        rangeRow.addView(edtFromChap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        TextView tvT = new TextView(this);
        tvT.setText("  Đến chương: ");
        tvT.setTextColor(Color.parseColor("#94A3B8"));
        tvT.setTextSize(12.5f);
        rangeRow.addView(tvT);

        edtToChap = new EditText(this);
        edtToChap.setText(String.valueOf(Math.max(rawChapters.size(), 1)));
        edtToChap.setTextColor(Color.WHITE);
        edtToChap.setBackground(createInputDrawable());
        edtToChap.setPadding(dp(12), dp(8), dp(12), dp(8));
        edtToChap.setTextSize(13f);
        edtToChap.setGravity(Gravity.CENTER);
        rangeRow.addView(edtToChap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardProgress.addView(rangeRow);

        // 3 Nút Điều Khiển: Dịch Range, Tạm dừng, Hủy
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        btnRow.setPadding(0, dp(8), 0, 0);

        btnStartRange = createGradientButton("DỊCH RANGE", Color.parseColor("#0284C7"), Color.parseColor("#00D2FF"));
        btnStartRange.setOnClickListener(v -> {
            triggerHaptic();
            startRangeTranslation();
        });
        btnRow.addView(btnStartRange, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f));

        btnPauseResume = createButton("TẠM DỪNG", "#D97706");
        btnPauseResume.setMinHeight(dp(48));
        LinearLayout.LayoutParams prlp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        prlp.setMargins(dp(6), 0, dp(6), 0);
        btnPauseResume.setLayoutParams(prlp);
        btnPauseResume.setOnClickListener(v -> {
            triggerHaptic();
            togglePauseResume();
        });
        btnRow.addView(btnPauseResume);

        btnCancelTrans = createButton("HỦY", "#7F1D1D");
        btnCancelTrans.setMinHeight(dp(48));
        btnCancelTrans.setOnClickListener(v -> {
            triggerHaptic();
            cancelTranslation();
        });
        btnRow.addView(btnCancelTrans, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.8f));

        cardProgress.addView(btnRow);

        btnFillGaps = createGradientButton("⚡ DỊCH BÙ CHƯƠNG SÓT (NÉ CÁC CHƯƠNG ĐÃ DỊCH)", Color.parseColor("#10B981"), Color.parseColor("#059669"));
        LinearLayout.LayoutParams fglp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fglp.setMargins(0, dp(10), 0, 0);
        btnFillGaps.setLayoutParams(fglp);
        btnFillGaps.setOnClickListener(v -> {
            triggerHaptic();
            startFillGapsTranslation();
        });
        cardProgress.addView(btnFillGaps);

        btnFinalPolish = createGradientButton("✨ LÀM MƯỢT BẢN DỊCH FINAL (QUÉT SẠCH CHỮ HÁN)", Color.parseColor("#8B5CF6"), Color.parseColor("#6366F1"));
        LinearLayout.LayoutParams fplp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fplp.setMargins(0, dp(10), 0, 0);
        btnFinalPolish.setLayoutParams(fplp);
        btnFinalPolish.setOnClickListener(v -> {
            triggerHaptic();
            executeFinalGlobalPolish();
        });
        cardProgress.addView(btnFinalPolish);

        content.addView(cardProgress);

        // =====================================================================
        // MỤC 3: KHO THUẬT NGỮ MASTER GLOSSARY (Card 3)
        // =====================================================================
        LinearLayout cardGloss = createCard();

        LinearLayout rowGlossHead = new LinearLayout(this);
        rowGlossHead.setOrientation(LinearLayout.HORIZONTAL);
        rowGlossHead.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvGlIcon = new TextView(this);
        tvGlIcon.setText("📖 ");
        tvGlIcon.setTextSize(15);
        rowGlossHead.addView(tvGlIcon);

        tvGlossaryHeader = new TextView(this);
        tvGlossaryHeader.setText("Từ Điển Master Glossary (" + masterGlossary.size() + " từ):");
        tvGlossaryHeader.setTextColor(Color.WHITE);
        tvGlossaryHeader.setTextSize(14f);
        tvGlossaryHeader.setTypeface(null, Typeface.BOLD);
        rowGlossHead.addView(tvGlossaryHeader);
        rowGlossHead.addView(createHelpButton("master_glossary"));

        View spGloss = new View(this);
        rowGlossHead.addView(spGloss, new LinearLayout.LayoutParams(0, 1, 1.0f));
        cardGloss.addView(rowGlossHead);

        LinearLayout rowAddG = new LinearLayout(this);
        rowAddG.setOrientation(LinearLayout.HORIZONTAL);
        rowAddG.setPadding(0, dp(10), 0, 0);

        edtGlossaryKey = createStyledEditText("Từ gốc (林辰)");
        rowAddG.addView(edtGlossaryKey, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sg = new View(this);
        rowAddG.addView(sg, new LinearLayout.LayoutParams(dp(8), 1));

        edtGlossaryVal = createStyledEditText("Nghĩa (Lâm Thần)");
        rowAddG.addView(edtGlossaryVal, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardGloss.addView(rowAddG);

        LinearLayout rowGButtons = new LinearLayout(this);
        rowGButtons.setOrientation(LinearLayout.HORIZONTAL);
        rowGButtons.setPadding(0, dp(10), 0, dp(4));

        Button btnAddG = createButton("+ Thêm Từ", "#059669");
        btnAddG.setOnClickListener(v -> {
            triggerHaptic();
            String k = edtGlossaryKey.getText().toString().trim();
            String val = edtGlossaryVal.getText().toString().trim();
            if (!k.isEmpty() && !val.isEmpty()) {
                masterGlossary.put(k, val);
                edtGlossaryKey.setText("");
                edtGlossaryVal.setText("");
                saveCurrentProjectData();
                refreshGlossaryList();
                Toast.makeText(this, "Đã thêm thuật ngữ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowGButtons.addView(btnAddG, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.2f));

        Button btnImportG = createButton("📥 Nạp .txt", "#1D4ED8");
        btnImportG.setOnClickListener(v -> {
            triggerHaptic();
            openGlossaryFilePicker();
        });
        LinearLayout.LayoutParams iglp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        iglp.setMargins(dp(6), 0, dp(6), 0);
        btnImportG.setLayoutParams(iglp);
        rowGButtons.addView(btnImportG);

        Button btnExportG = createButton("📤 Xuất", "#374151");
        btnExportG.setOnClickListener(v -> {
            triggerHaptic();
            exportGlossaryData();
        });
        rowGButtons.addView(btnExportG, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.8f));

        cardGloss.addView(rowGButtons);

        llGlossaryList = new LinearLayout(this);
        llGlossaryList.setOrientation(LinearLayout.VERTICAL);
        llGlossaryList.setPadding(0, 8, 0, 0);
        cardGloss.addView(llGlossaryList);
        refreshGlossaryList();

        content.addView(cardGloss);

        // 5. Live Console Logs
        TextView tvLogTitle = new TextView(this);
        tvLogTitle.setText("Live Console Logs:");
        tvLogTitle.setTextColor(Color.parseColor("#9CA3AF"));
        tvLogTitle.setPadding(0, 16, 0, 8);
        content.addView(tvLogTitle);

        tvLiveLogs = new TextView(this);
        tvLiveLogs.setBackgroundColor(Color.parseColor("#050505"));
        tvLiveLogs.setTextColor(Color.parseColor("#10B981"));
        tvLiveLogs.setTextSize(11);
        tvLiveLogs.setPadding(16, 16, 16, 16);
        tvLiveLogs.setText("🚀 DroidTranslator Native Sẵn Sàng!\n");
        content.addView(tvLiveLogs);

        tabTranslateView.addView(content);
    }

    private void showNewProjectDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Tạo Dự Án Dịch Mới");

        EditText input = new EditText(this);
        input.setHint("Nhập tên truyện (VD: Tien_Nghich)");
        builder.setView(input);

        builder.setPositiveButton("Tạo Mới", (dialog, which) -> {
            String name = input.getText().toString().trim().replace(" ", "_");
            if (!name.isEmpty()) {
                saveCurrentProjectData();
                if (!projectList.contains(name)) {
                    projectList.add(name);
                }
                currentProjectName = name;
                tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);

                // Làm mới dữ liệu độc lập cho truyện mới
                rawChapters.clear();
                translatedChapters.clear();
                masterGlossary.clear();
                loadedRawContent = "";
                currentChapterIdx = 0;

                saveCurrentProjectData();
                saveAllState();

                updateProgressUI();
                refreshGlossaryList();
                refreshChapterListView();
                refreshSettingsUI();
                appendLog("📁 Đã tạo và chuyển sang dự án mới: " + name);
                Toast.makeText(this, "Đã tạo dự án mới: " + name, Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void showSwitchProjectDialog() {
        if (projectList.isEmpty()) return;
        String[] items = projectList.toArray(new String[0]);
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Chọn Dự Án Truyện");
        builder.setItems(items, (dialog, which) -> {
            String chosen = items[which];
            saveCurrentProjectData();
            currentProjectName = chosen;
            loadCurrentProjectData(chosen);
            saveAllState();

            tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
            updateProgressUI();
            refreshGlossaryList();
            refreshChapterListView();
            refreshSettingsUI();
            appendLog("📁 Đã chuyển sang dự án: " + chosen + " (" + translatedChapters.size() + "/" + rawChapters.size() + " chương)");
            Toast.makeText(this, "Đã chọn dự án: " + chosen, Toast.LENGTH_SHORT).show();
        });
        builder.show();
    }

    private void deleteProject(String name) {
        if (projectList.size() <= 1) {
            Toast.makeText(this, "Không thể xóa dự án duy nhất còn lại!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            java.io.File pFile = new java.io.File(new java.io.File(getFilesDir(), "projects"), name + ".json");
            if (pFile.exists()) {
                pFile.delete();
            }
            projectList.remove(name);
            String nextProject = projectList.get(0);
            currentProjectName = nextProject;
            loadCurrentProjectData(nextProject);
            saveAllState();

            tvCurrentProjectName.setText("📖 Dự án: " + currentProjectName);
            updateProgressUI();
            refreshGlossaryList();
            refreshChapterListView();
            refreshSettingsUI();
            appendLog("🗑️ Đã xóa vĩnh viễn dự án: " + name + ". Toàn bộ Key API và Prompt được bảo toàn 100%!");
            Toast.makeText(this, "Đã xóa dự án: " + name, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Lỗi khi xóa dự án: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void showDeleteProjectConfirmationDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Xác Nhận Xóa Vĩnh Viễn Dự Án");
        String nl = String.valueOf((char) 10);
        builder.setMessage("Bạn có chắc chắn muốn xóa dự án [" + currentProjectName + "]?" + nl + nl + "• Toàn bộ chương thô, bản dịch và từ điển riêng của truyện này sẽ bị xóa khỏi bộ nhớ máy." + nl + "• Toàn bộ kho Key API và Thẻ Prompt sẽ ĐƯỢC BẢO TOÀN VĨNH CỬU 100%!");
        builder.setPositiveButton("Xác Nhận Xóa", (dialog, which) -> deleteProject(currentProjectName));
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        String[] mimeTypes = {"text/plain", "application/epub+zip", "application/x-mobipocket-ebook", "application/octet-stream"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        try {
            startActivityForResult(intent, REQUEST_PICK_FILE);
        } catch (Exception e) {
            Toast.makeText(this, "Không tìm thấy trình quản lý tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void openGlossaryFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("text/*");
        try {
            startActivityForResult(intent, REQUEST_PICK_GLOSSARY_FILE);
        } catch (Exception e) {
            Toast.makeText(this, "Không tìm thấy trình quản lý tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_PICK_FILE && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                appendLog("⏳ Đang nạp và giải mã tệp Ebook từ bộ nhớ...");
                Toast.makeText(this, "Đang đọc tệp Ebook...", Toast.LENGTH_SHORT).show();
                new Thread(() -> {
                    try {
                        InputStream is = getContentResolver().openInputStream(uri);
                        String fileName = "ebook.txt";
                        try {
                            android.database.Cursor cursor = getContentResolver().query(uri, null, null, null, null);
                            if (cursor != null && cursor.moveToFirst()) {
                                int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                                if (nameIndex != -1) fileName = cursor.getString(nameIndex);
                                cursor.close();
                            }
                        } catch (Exception ignored) {}

                        String lowerName = fileName.toLowerCase();
                        StringBuilder sb = new StringBuilder();
                        String nl = String.valueOf((char) 10);

                        if (lowerName.endsWith(".epub")) {
                            // Native Java EPUB ZIP parser
                            java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(is);
                            java.util.zip.ZipEntry entry;
                            while ((entry = zis.getNextEntry()) != null) {
                                String en = entry.getName().toLowerCase();
                                if ((en.endsWith(".xhtml") || en.endsWith(".html") || en.endsWith(".htm")) && !en.contains("toc")) {
                                    BufferedReader br = new BufferedReader(new InputStreamReader(zis, java.nio.charset.StandardCharsets.UTF_8));
                                    String l;
                                    StringBuilder htmlSb = new StringBuilder();
                                    while ((l = br.readLine()) != null) {
                                        htmlSb.append(l).append(nl);
                                    }
                                    // Làm sạch thẻ HTML
                                    String plain = htmlSb.toString()
                                            .replaceAll("(?i)<br[ \t\n\r]*/?>", nl)
                                            .replaceAll("(?i)</p>", nl + nl)
                                            .replaceAll("(?i)</div>", nl)
                                            .replaceAll("<[^>]+>", " ")
                                            .replaceAll("&nbsp;", " ")
                                            .replaceAll("&quot;", String.valueOf((char) 34))
                                            .replaceAll("&apos;", "'")
                                            .replaceAll("&lt;", "<")
                                            .replaceAll("&gt;", ">")
                                            .replaceAll("&amp;", "&")
                                            .trim();
                                    if (plain.length() > 50) {
                                        sb.append(plain).append(nl).append(nl);
                                    }
                                }
                                zis.closeEntry();
                            }
                            zis.close();
                        } else {
                            // TXT hoặc MOBI/AZW3 stream
                            BufferedReader reader = new BufferedReader(new InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8));
                            String line;
                            while ((line = reader.readLine()) != null) {
                                sb.append(line).append(nl);
                            }
                            reader.close();
                        }

                        final String fullText = sb.toString();
                        final String finalFileName = fileName;
                        mainHandler.post(() -> {
                            loadedRawContent = fullText;
                            if (fullText.length() > 6000) {
                                edtRawText.setText(fullText.substring(0, 3000) + nl + nl + "... [Đã nạp file Ebook (" + finalFileName + ") hoàn chỉnh " + fullText.length() + " ký tự]");
                            } else {
                                edtRawText.setText(fullText);
                            }
                            splitRawTextFromContent(fullText, false);
                            appendLog("📚 Đã nạp thành công file Ebook [" + finalFileName + "] (" + rawChapters.size() + " chương)!");
                            Toast.makeText(MainActivity.this, "Đã nạp file Ebook và tách " + rawChapters.size() + " chương thành công!", Toast.LENGTH_SHORT).show();
                        });
                    } catch (Exception e) {
                        mainHandler.post(() -> {
                            appendLog("❌ Lỗi đọc tệp Ebook: " + e.getMessage());
                            Toast.makeText(MainActivity.this, "Lỗi đọc tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        });
                    }
                }).start();
            }
        } else if (requestCode == REQUEST_PICK_GLOSSARY_FILE && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                appendLog("⏳ Đang nạp tệp Glossary .txt từ bộ nhớ...");
                Toast.makeText(this, "Đang đọc tệp Glossary...", Toast.LENGTH_SHORT).show();
                new Thread(() -> {
                    try {
                        InputStream is = getContentResolver().openInputStream(uri);
                        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                        String line;
                        int count = 0;
                        while ((line = reader.readLine()) != null) {
                            line = line.trim();
                            if (line.isEmpty() || line.startsWith("#") || line.startsWith("//")) continue;
                            String raw = "";
                            String vi = "";
                            if (line.contains("=")) {
                                int eqIdx = line.indexOf("=");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains("➔")) {
                                int eqIdx = line.indexOf("➔");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains("->")) {
                                int eqIdx = line.indexOf("->");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 2).trim();
                            } else if (line.contains(":")) {
                                int eqIdx = line.indexOf(":");
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            } else if (line.contains(String.valueOf((char) 9))) {
                                int eqIdx = line.indexOf((char) 9);
                                raw = line.substring(0, eqIdx).trim();
                                vi = line.substring(eqIdx + 1).trim();
                            }
                            if (!raw.isEmpty() && !vi.isEmpty()) {
                                masterGlossary.put(raw, vi);
                                count++;
                            }
                        }
                        reader.close();
                        final int importedCount = count;
                        mainHandler.post(() -> {
                            saveCurrentProjectData();
                            refreshGlossaryList();
                            appendLog("📚 Đã nạp thành công " + importedCount + " thuật ngữ vào Master Glossary của dự án [" + currentProjectName + "]!");
                            Toast.makeText(MainActivity.this, "Đã nạp thành công " + importedCount + " thuật ngữ!", Toast.LENGTH_SHORT).show();
                        });
                    } catch (Exception e) {
                        mainHandler.post(() -> {
                            appendLog("❌ Lỗi nạp Glossary: " + e.getMessage());
                            Toast.makeText(MainActivity.this, "Lỗi nạp tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        });
                    }
                }).start();
            }
        }
    }

    private void exportGlossaryData() {
        if (masterGlossary.isEmpty()) {
            Toast.makeText(this, "Kho từ điển đang trống!", Toast.LENGTH_SHORT).show();
            return;
        }
        StringBuilder sb = new StringBuilder();
        String nl = String.valueOf((char) 10);
        sb.append("# Master Glossary - ").append(currentProjectName).append(nl);
        sb.append("# Định dạng: tên raw=tên tiếng việt").append(nl).append(nl);
        for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
            sb.append(entry.getKey()).append("=").append(entry.getValue()).append(nl);
        }
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("Glossary", sb.toString()));
            appendLog("📋 Đã sao chép " + masterGlossary.size() + " thuật ngữ dạng raw=vi vào Clipboard!");
            Toast.makeText(this, "Đã sao chép " + masterGlossary.size() + " từ (dạng raw=vi) vào bộ nhớ tạm!", Toast.LENGTH_LONG).show();
        }
    }

    private void showEditGlossaryDialog(final String oldRaw, final String oldVi) {
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("Chỉnh Sửa Thuật Ngữ");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(36, 24, 36, 16);

        TextView tvRawL = new TextView(this);
        tvRawL.setText("Từ gốc (Tiếng Trung / Raw):");
        tvRawL.setTextColor(Color.parseColor("#93C5FD"));
        tvRawL.setTextSize(12);
        layout.addView(tvRawL);

        final EditText edtRaw = createStyledEditText("VD: 林辰");
        edtRaw.setText(oldRaw);
        layout.addView(edtRaw);

        TextView tvViL = new TextView(this);
        tvViL.setText("Nghĩa dịch tiếng Việt chuẩn:");
        tvViL.setTextColor(Color.parseColor("#34D399"));
        tvViL.setTextSize(12);
        tvViL.setPadding(0, 16, 0, 0);
        layout.addView(tvViL);

        final EditText edtVi = createStyledEditText("VD: Lâm Thần");
        edtVi.setText(oldVi);
        layout.addView(edtVi);

        builder.setView(layout);
        builder.setPositiveButton("Lưu Thay Đổi", (dialog, which) -> {
            String newRaw = edtRaw.getText().toString().trim();
            String newVi = edtVi.getText().toString().trim();
            if (!newRaw.isEmpty() && !newVi.isEmpty()) {
                if (!newRaw.equals(oldRaw)) {
                    masterGlossary.remove(oldRaw);
                }
                masterGlossary.put(newRaw, newVi);
                saveCurrentProjectData();
                refreshGlossaryList();
                appendLog("✏️ Đã cập nhật thuật ngữ: [" + oldRaw + "] ➔ [" + newRaw + " = " + newVi + "]");
                Toast.makeText(MainActivity.this, "Đã cập nhật thuật ngữ!", Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Hủy", null);
        builder.show();
    }

    private void splitRawText(boolean byChars) {
        String text = (loadedRawContent != null && !loadedRawContent.isEmpty()) ? loadedRawContent : edtRawText.getText().toString().trim();
        splitRawTextFromContent(text, byChars);
    }

    private void splitRawTextFromContent(String text, boolean byChars) {
        if (text == null || text.trim().isEmpty()) {
            Toast.makeText(this, "Vui lòng dán văn bản truyện!", Toast.LENGTH_SHORT).show();
            return;
        }

        rawChapters.clear();
        chapterListPage = 0;
        if (!byChars) {
            String[] parts = text.split("(?i)(?=(?:^[ \t]*|[\r\n]+[ \t]*)(?:第[ \t]*[0-9一二三四五六七八九十百千万]+[ \t]*[章回节卷部集]|Chương[ \t]*[0-9]+|Chapter[ \t]*[0-9]+|[0-9]{1,5}[ \t]*[、.][ \t]*(?:第[ \t]*)?[0-9一二三四五六七八九十百千万]*[章回节卷]?))");
            for (String p : parts) {
                if (!p.trim().isEmpty()) rawChapters.add(p.trim());
            }
        } else {
            int chunkSize = 3500;
            try {
                chunkSize = Integer.parseInt(edtChunkSize.getText().toString().trim());
            } catch (Exception ignored) {}
            chunkSize = Math.max(500, chunkSize);

            for (int i = 0; i < text.length(); i += chunkSize) {
                rawChapters.add(text.substring(i, Math.min(i + chunkSize, text.length())));
            }
        }

        if (rawChapters.isEmpty()) rawChapters.add(text);

        edtFromChap.setText("1");
        edtToChap.setText(String.valueOf(rawChapters.size()));
        saveCurrentProjectData();
        saveAllState();

        updateProgressUI();
        refreshChapterListView();
        appendLog("✂️ Đã tách thành " + rawChapters.size() + " chương (" + (byChars ? "Tùy ký tự" : "Theo tác giả") + ")");
        Toast.makeText(this, "Đã tách thành " + rawChapters.size() + " chương!", Toast.LENGTH_SHORT).show();
    }

    // Refresh UI Glossary List (Hiển thị 6 từ gần nhất chống khựng, có nút mở Kho Từ Điển Full)
    private void refreshGlossaryList() {
        if (llGlossaryList == null) return;
        llGlossaryList.removeAllViews();

        if (tvGlossaryHeader != null) {
            tvGlossaryHeader.setText("Từ Điển Master Glossary (" + masterGlossary.size() + " từ):");
        }

        if (masterGlossary.isEmpty()) {
            TextView tvEmpty = new TextView(this);
            tvEmpty.setText("Chưa có từ điển. Sau khi dịch mỗi chương, AI sẽ tự động thêm từ mới vào đây.");
            tvEmpty.setTextColor(Color.parseColor("#777777"));
            tvEmpty.setTextSize(11);
            tvEmpty.setPadding(0, 8, 0, 8);
            llGlossaryList.addView(tvEmpty);
            return;
        }

        // Hiển thị tối đa 6 từ gần nhất trên thẻ chính
        int count = 0;
        List<Map.Entry<String, String>> entryList = new ArrayList<>(masterGlossary.entrySet());
        Collections.reverse(entryList);
        for (Map.Entry<String, String> entry : entryList) {
            if (count >= 6) break;
            count++;

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(16, 12, 16, 12);
            row.setBackgroundColor(Color.parseColor("#171717"));
            row.setGravity(Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, 6);
            row.setLayoutParams(lp);

            TextView tvPair = new TextView(this);
            tvPair.setText(entry.getKey() + " ➔ " + entry.getValue());
            tvPair.setTextColor(Color.parseColor("#34D399"));
            tvPair.setTextSize(12);
            row.addView(tvPair, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            Button btnEdit = createButton("Sửa", "#1E293B");
            btnEdit.setOnClickListener(v -> showEditGlossaryDialog(entry.getKey(), entry.getValue()));
            row.addView(btnEdit);

            View sp = new View(this);
            row.addView(sp, new LinearLayout.LayoutParams(6, 1));

            Button btnDel = createButton("✕", "#7F1D1D");
            btnDel.setOnClickListener(v -> {
                masterGlossary.remove(entry.getKey());
                refreshGlossaryList();
            });
            row.addView(btnDel);

            llGlossaryList.addView(row);
        }

        // Nút mở kho từ điển toàn diện (Full Dialog có tìm kiếm, không làm giật màn hình)
        Button btnViewAll = createButton("📖 Mở Kho Từ Điển Đầy Đủ (" + masterGlossary.size() + " từ) ▾", "#1E293B");
        btnViewAll.setOnClickListener(v -> showFullGlossaryDialog());
        llGlossaryList.addView(btnViewAll);
    }

    private void showFullGlossaryDialog() {
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("Kho Từ Điển Master Glossary (" + masterGlossary.size() + " từ)");

        LinearLayout dialogLayout = new LinearLayout(this);
        dialogLayout.setOrientation(LinearLayout.VERTICAL);
        dialogLayout.setPadding(24, 16, 24, 16);

        final EditText edtSearch = createStyledEditText("Tìm kiếm từ gốc hoặc nghĩa dịch...");
        dialogLayout.addView(edtSearch);

        // Action Toolbar in Dialog
        LinearLayout toolbarRow = new LinearLayout(this);
        toolbarRow.setOrientation(LinearLayout.HORIZONTAL);
        toolbarRow.setPadding(0, 10, 0, 10);

        Button btnImportFull = createButton("📥 Nạp File .txt", "#1D4ED8");
        btnImportFull.setOnClickListener(v -> openGlossaryFilePicker());
        toolbarRow.addView(btnImportFull, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View sp1 = new View(this);
        toolbarRow.addView(sp1, new LinearLayout.LayoutParams(8, 1));

        Button btnExportFull = createButton("📤 Xuất .txt", "#374151");
        btnExportFull.setOnClickListener(v -> exportGlossaryData());
        toolbarRow.addView(btnExportFull);

        dialogLayout.addView(toolbarRow);

        ScrollView sv = new ScrollView(this);
        final LinearLayout itemsLayout = new LinearLayout(this);
        itemsLayout.setOrientation(LinearLayout.VERTICAL);
        itemsLayout.setPadding(0, 10, 0, 10);

        final Runnable populate = () -> {
            itemsLayout.removeAllViews();
            String query = edtSearch.getText().toString().trim().toLowerCase();
            for (Map.Entry<String, String> entry : masterGlossary.entrySet()) {
                if (query.isEmpty() || entry.getKey().toLowerCase().contains(query) || entry.getValue().toLowerCase().contains(query)) {
                    LinearLayout row = new LinearLayout(this);
                    row.setOrientation(LinearLayout.HORIZONTAL);
                    row.setPadding(16, 10, 16, 10);
                    row.setBackgroundColor(Color.parseColor("#171717"));
                    row.setGravity(Gravity.CENTER_VERTICAL);
                    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                    lp.setMargins(0, 0, 0, 6);
                    row.setLayoutParams(lp);

                    TextView tvPair = new TextView(this);
                    tvPair.setText(entry.getKey() + " ➔ " + entry.getValue());
                    tvPair.setTextColor(Color.parseColor("#34D399"));
                    tvPair.setTextSize(13);
                    row.addView(tvPair, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

                    Button btnEdit = createButton("Sửa", "#1E293B");
                    btnEdit.setOnClickListener(v -> showEditGlossaryDialog(entry.getKey(), entry.getValue()));
                    row.addView(btnEdit);

                    View spd = new View(this);
                    row.addView(spd, new LinearLayout.LayoutParams(6, 1));

                    Button btnDel = createButton("✕", "#7F1D1D");
                    btnDel.setOnClickListener(v -> {
                        masterGlossary.remove(entry.getKey());
                        saveCurrentProjectData();
                        refreshGlossaryList();
                        row.setVisibility(View.GONE);
                    });
                    row.addView(btnDel);

                    itemsLayout.addView(row);
                }
            }
        };

        edtSearch.addTextChangedListener(new android.text.TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) { populate.run(); }
            public void afterTextChanged(android.text.Editable s) {}
        });

        populate.run();
        sv.addView(itemsLayout);
        dialogLayout.addView(sv, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 800));

        builder.setView(dialogLayout);
        builder.setPositiveButton("Đóng", null);
        builder.show();
    }

    private void startRangeTranslation() {
        if (rawChapters.isEmpty()) {
            Toast.makeText(this, "Vui lòng nạp và tách chương trước!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            rangeFromChap = Integer.parseInt(edtFromChap.getText().toString().trim());
            rangeToChap = Integer.parseInt(edtToChap.getText().toString().trim());
        } catch (Exception e) {
            rangeFromChap = 1;
            rangeToChap = rawChapters.size();
        }

        rangeFromChap = Math.max(1, Math.min(rangeFromChap, rawChapters.size()));
        rangeToChap = Math.max(rangeFromChap, Math.min(rangeToChap, rawChapters.size()));

        isGapFillingMode = false;
        currentChapterIdx = rangeFromChap - 1;
        isTranslating = true;
        isPaused = false;
        btnPauseResume.setText("Tạm dừng");

        // Bật Foreground Service
        Intent serviceIntent = new Intent(this, TranslationForegroundService.class);
        serviceIntent.putExtra("INFO", "Đang dịch nền từ Chương " + rangeFromChap + " đến " + rangeToChap);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        appendLog("▶ Bắt đầu dịch Range: Chương " + rangeFromChap + " ➔ " + rangeToChap + "...");
        startTranslationLoop();
    }

    private void startFillGapsTranslation() {
        if (rawChapters.isEmpty()) {
            Toast.makeText(this, "Vui lòng nạp và tách chương trước!", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            rangeFromChap = Integer.parseInt(edtFromChap.getText().toString().trim());
            rangeToChap = Integer.parseInt(edtToChap.getText().toString().trim());
        } catch (Exception e) {
            rangeFromChap = 1;
            rangeToChap = rawChapters.size();
        }

        rangeFromChap = Math.max(1, Math.min(rangeFromChap, rawChapters.size()));
        rangeToChap = Math.max(rangeFromChap, Math.min(rangeToChap, rawChapters.size()));

        // Quét danh sách các chương còn thiếu trong khoảng
        List<Integer> missingIndices = new ArrayList<>();
        for (int i = rangeFromChap - 1; i < rangeToChap && i < rawChapters.size(); i++) {
            if (!translatedChapters.containsKey(i) || translatedChapters.get(i) == null || translatedChapters.get(i).trim().isEmpty()) {
                missingIndices.add(i);
            }
        }

        if (missingIndices.isEmpty()) {
            Toast.makeText(this, "🎉 Toàn bộ chương từ " + rangeFromChap + " đến " + rangeToChap + " đều đã có bản dịch! Không có chương nào bị sót.", Toast.LENGTH_LONG).show();
            appendLog("🎉 Đã kiểm tra khoảng Chương " + rangeFromChap + " ➔ " + rangeToChap + ": Đã hoàn thành 100%, không có chương nào bị sót!");
            return;
        }

        isGapFillingMode = true;
        currentChapterIdx = rangeFromChap - 1;
        isTranslating = true;
        isPaused = false;
        btnPauseResume.setText("Tạm dừng");

        // Bật Foreground Service
        Intent serviceIntent = new Intent(this, TranslationForegroundService.class);
        serviceIntent.putExtra("INFO", "Đang dịch bù " + missingIndices.size() + " chương thiếu (né chương đã dịch)");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }

        StringBuilder sbMiss = new StringBuilder();
        int previewCount = Math.min(missingIndices.size(), 8);
        for (int m = 0; m < previewCount; m++) {
            sbMiss.append(missingIndices.get(m) + 1).append(m < previewCount - 1 ? ", " : "");
        }
        if (missingIndices.size() > 8) sbMiss.append("...");

        appendLog("⚡ [DỊCH BÙ THÔNG MINH] Phát hiện " + missingIndices.size() + " chương chưa dịch (Chương " + sbMiss.toString() + "). Tự động né 100% các chương đã có bản dịch!");
        Toast.makeText(this, "Đang dịch bù " + missingIndices.size() + " chương còn thiếu!", Toast.LENGTH_SHORT).show();

        startTranslationLoop();
    }

    private void togglePauseResume() {
        if (!isTranslating) return;
        isPaused = !isPaused;
        btnPauseResume.setText(isPaused ? "Tiếp tục" : "Tạm dừng");
        if (isPaused) {
            appendLog("⏸ Đã tạm dừng tại Chương " + (currentChapterIdx + 1) + " (Chương này chưa hoàn tất).");
            Toast.makeText(this, "Đã tạm dừng dịch tại Chương " + (currentChapterIdx + 1), Toast.LENGTH_SHORT).show();
        } else {
            appendLog("▶ Tiếp tục dịch lại Chương " + (currentChapterIdx + 1) + " (chương đang dở dang)...");
            Toast.makeText(this, "Tiếp tục dịch Chương " + (currentChapterIdx + 1), Toast.LENGTH_SHORT).show();
        }
    }

    private void cancelTranslation() {
        isTranslating = false;
        isPaused = false;
        isGapFillingMode = false;
        btnPauseResume.setText("Tạm dừng");
        stopService(new Intent(this, TranslationForegroundService.class));
        appendLog("⏹ Đã hủy tiến trình dịch.");
        Toast.makeText(this, "Đã hủy tiến trình dịch.", Toast.LENGTH_SHORT).show();
    }

    private void startTranslationLoop() {
        new Thread(() -> {
            while (isTranslating && currentChapterIdx < rangeToChap && currentChapterIdx < rawChapters.size()) {
                if (isPaused) {
                    try { Thread.sleep(500); } catch (Exception ignored) {}
                    continue;
                }

                final int chapIndex = currentChapterIdx;

                // NẾU ĐANG Ở CHẾ ĐỘ DỊCH BÙ VÀ CHƯƠNG NÀY ĐÃ CÓ BẢN DỊCH:
                if (isGapFillingMode && translatedChapters.containsKey(chapIndex) && translatedChapters.get(chapIndex) != null && !translatedChapters.get(chapIndex).trim().isEmpty()) {
                    mainHandler.post(() -> appendLog("⏭️ [NÉ ĐÃ DỊCH] Chương " + (chapIndex + 1) + " đã có bản dịch hoàn chỉnh, tự động lướt qua!"));
                    currentChapterIdx++;
                    continue;
                }

                appendLog("⚡ Đang gửi Chương " + (chapIndex + 1) + " đến " + currentModel + "...");

                try {
                    String activePrompt = "Dịch tiểu thuyết mượt mà";
                    for (PromptCardItem p : promptCards) {
                        if (p.active) { activePrompt = p.content; break; }
                    }

                    // Tự động trích xuất 300-350 ký tự cuối của bản dịch chương trước để bắt nhịp ngữ cảnh
                    String prevSnippet = null;
                    if (chapIndex > 0 && translatedChapters.containsKey(chapIndex - 1)) {
                        String prevTrans = translatedChapters.get(chapIndex - 1);
                        if (prevTrans != null && !prevTrans.trim().isEmpty()) {
                            int takeLen = Math.min(prevTrans.length(), 350);
                            prevSnippet = "..." + prevTrans.substring(prevTrans.length() - takeLen).trim();
                        }
                    }

                    String[] result = engine.translateChapter(
                            rawChapters.get(chapIndex),
                            prevSnippet,
                            activePrompt,
                            masterGlossary,
                            currentModel,
                            targetLanguage,
                            antiHanziStrict,
                            minTermLength,
                            minFrequency,
                            msg -> mainHandler.post(() -> appendLog(msg))
                    );

                    String translatedText = result[0];
                    String newGlossaryRaw = (result.length > 1) ? result[1] : "";

                    // Lớp 2: Hậu kiểm Regex chống lọt chữ Hán cho bản dịch tiếng Việt
                    if (targetLanguage.contains("Việt") && antiHanziStrict) {
                        List<Map.Entry<String, String>> sortedEntries = new ArrayList<>(masterGlossary.entrySet());
                        sortedEntries.sort((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));
                        for (Map.Entry<String, String> gEntry : sortedEntries) {
                            if (translatedText.contains(gEntry.getKey())) {
                                translatedText = translatedText.replace(gEntry.getKey(), gEntry.getValue());
                            }
                        }
                    }

                    // TẦNG KIỂM ĐỊNH NGOẠI TUYẾN (Offline Quality Audit)
                    ChapterAuditor.AuditResult audit = ChapterAuditor.auditChapter(
                            rawChapters.get(chapIndex),
                            translatedText,
                            masterGlossary,
                            targetLanguage,
                            antiHanziStrict
                    );

                    // TỰ ĐỘNG ĐẨY LÊN ONLINE DỊCH LẠI & GHI ĐÈ NẾU BẢN DỊCH BỊ LỖI NẶNG
                    if (autoHealOnlineEnabled && !audit.isValid && audit.hasCriticalError) {
                        final String primaryIssue = audit.getPrimaryIssue();
                        mainHandler.post(() -> appendLog("⚠️ [PHÁT HIỆN LỖI NẶNG] Chương " + (chapIndex + 1) + ": " + primaryIssue + ". Đang đẩy lên AI dịch lại (Auto-Heal Online)..."));

                        String rescuePrompt = "LỆNH CỨU HỘ ĐẶC BIỆT: Bản dịch trước bị lỗi nghiêm trọng [" + primaryIssue + "]. "
                                + "YÊU CẦU DỊCH LẠI TOÀN BỘ: Dịch trọn vẹn chương sau sang " + targetLanguage + " đầy đủ 100%, tuyệt đối không tóm tắt, không bỏ sót câu chữ nào, không để sót chữ Hán thô trong câu văn, không lặp lại câu vô nghĩa.";

                        try {
                            String[] rescueResult = engine.translateChapter(
                                    rawChapters.get(chapIndex),
                                    prevSnippet,
                                    activePrompt,
                                    masterGlossary,
                                    currentModel,
                                    targetLanguage,
                                    antiHanziStrict,
                                    minTermLength,
                                    minFrequency,
                                    rescuePrompt,
                                    msg -> mainHandler.post(() -> appendLog(msg))
                            );

                            String rescueTranslated = rescueResult[0];
                            if (targetLanguage.contains("Việt") && antiHanziStrict) {
                                List<Map.Entry<String, String>> sortedEntries = new ArrayList<>(masterGlossary.entrySet());
                                sortedEntries.sort((a, b) -> Integer.compare(b.getKey().length(), a.getKey().length()));
                                for (Map.Entry<String, String> gEntry : sortedEntries) {
                                    if (rescueTranslated.contains(gEntry.getKey())) {
                                        rescueTranslated = rescueTranslated.replace(gEntry.getKey(), gEntry.getValue());
                                    }
                                }
                            }

                            ChapterAuditor.AuditResult rescueAudit = ChapterAuditor.auditChapter(
                                    rawChapters.get(chapIndex),
                                    rescueTranslated,
                                    masterGlossary,
                                    targetLanguage,
                                    antiHanziStrict
                            );

                            if (rescueAudit.isValid || rescueAudit.score > audit.score) {
                                translatedText = rescueAudit.cleanedText;
                                if (rescueResult.length > 1 && rescueResult[1] != null && !rescueResult[1].trim().isEmpty()) {
                                    newGlossaryRaw = rescueResult[1];
                                }
                                final int finalScore = rescueAudit.score;
                                mainHandler.post(() -> appendLog("🎯 [CỨU HỘ THÀNH CÔNG] Chương " + (chapIndex + 1) + " đã được dịch lại chuẩn (Điểm: " + finalScore + "/100). Ghi đè vào bộ nhớ!"));
                            } else {
                                translatedText = audit.cleanedText;
                                mainHandler.post(() -> appendLog("🛡️ [CỨU HỘ NGOẠI TUYẾN] Dùng bản vá sạch ngoại tuyến cho Chương " + (chapIndex + 1) + "."));
                            }
                        } catch (Exception exRescue) {
                            translatedText = audit.cleanedText;
                            mainHandler.post(() -> appendLog("🛡️ [LỖI MẠNG CỨU HỘ] Dùng bản vá sạch ngoại tuyến cho Chương " + (chapIndex + 1) + ": " + exRescue.getMessage()));
                        }
                    } else {
                        translatedText = audit.cleanedText;
                        if (!audit.healedActions.isEmpty()) {
                            final String actions = String.join(", ", audit.healedActions);
                            mainHandler.post(() -> appendLog("🧹 [TỰ VÁ OFFLINE] Chương " + (chapIndex + 1) + ": Đã " + actions));
                        }
                    }

                    translatedChapters.put(chapIndex, translatedText);

                    // Bóc tách thuật ngữ mới tuân thủ minTermLength, minFrequency và conflictPolicy
                    List<GlossaryManager.GlossaryEntry> newlyAdded = new ArrayList<>();
                    if (newGlossaryRaw != null && !newGlossaryRaw.trim().isEmpty()) {
                        newlyAdded = GlossaryManager.mergeNewEntries(masterGlossary, newGlossaryRaw, rawChapters.get(chapIndex), minTermLength, minFrequency, conflictPolicy);
                    }

                    saveCurrentProjectData(); // Lưu bền vững vào ổ nhớ ngay lập tức sau mỗi chương!

                    final List<GlossaryManager.GlossaryEntry> finalAdded = newlyAdded;
                    mainHandler.post(() -> {
                        updateProgressUI();
                        refreshGlossaryList(); // TỰ ĐỘNG CẬP NHẬT GIAO DIỆN GLOSSARY THỜI GIAN THỰC!
                        refreshChapterListView();

                        if (!finalAdded.isEmpty()) {
                            StringBuilder sb = new StringBuilder("📚 Đã tự học " + finalAdded.size() + " từ mới: ");
                            for (GlossaryManager.GlossaryEntry e : finalAdded) {
                                sb.append("[").append(e.key).append(" ➔ ").append(e.value).append("] ");
                            }
                            appendLog(sb.toString());
                            Toast.makeText(MainActivity.this, "Đã nạp thêm " + finalAdded.size() + " từ mới vào Glossary!", Toast.LENGTH_SHORT).show();
                        }

                        appendLog("✅ Hoàn tất Chương " + (chapIndex + 1));
                    });

                    currentChapterIdx++;
                    Thread.sleep(delaySec * 1000L);
                } catch (Exception e) {
                    mainHandler.post(() -> appendLog("❌ Lỗi chương " + (chapIndex + 1) + ": " + e.getMessage()));
                    currentChapterIdx++;
                    try { Thread.sleep(3000); } catch (Exception ignored) {}
                }
            }

            mainHandler.post(() -> {
                if (currentChapterIdx >= rangeToChap || currentChapterIdx >= rawChapters.size()) {
                    isTranslating = false;
                    isGapFillingMode = false;
                    appendLog("🎉 Đã hoàn thành khoảng chương yêu cầu!");
                    Toast.makeText(MainActivity.this, "Đã hoàn thành dịch khoảng chương!", Toast.LENGTH_LONG).show();

                    // TỰ ĐỘNG KÍCH HOẠT BỘ QUÉT LÀM MƯỢT FINAL SAU KHI DỊCH XONG TOÀN BỘ CHƯƠNG CUỐI
                    if (currentChapterIdx >= rawChapters.size() || currentChapterIdx >= rangeToChap) {
                        appendLog("🚀 [AUTO POLISH] Đang tự động kích hoạt Bộ Quét Làm Mượt Final...");
                        executeFinalGlobalPolish();
                    }
                }
            });
        }).start();
    }

    private void executeFinalGlobalPolish() {
        if (isPolishing) {
            Toast.makeText(this, "Đang trong tiến trình làm mượt!", Toast.LENGTH_SHORT).show();
            return;
        }
        if (translatedChapters.isEmpty()) {
            Toast.makeText(this, "Chưa có bản dịch nào để làm mượt!", Toast.LENGTH_SHORT).show();
            return;
        }

        appendLog("🔍 [LÀM MƯỢT FINAL] Đang quét Offline toàn bộ " + translatedChapters.size() + " chương bản dịch...");

        new Thread(() -> {
            isPolishing = true;
            try {
                int loopIteration = 0;
                int totalCumulativeFixedWords = 0;
                int totalCumulativeReplacements = 0;
                String targetPolishModel = (polishModel != null && !polishModel.isEmpty()) ? polishModel : "gemini-3.6-flash";

                while (loopIteration < 20) {
                    loopIteration++;
                    final int currentRound = loopIteration;

                    // 1. Quét Offline phân loại 3 nhóm thông minh
                    HanziSweeperEngine.TriagedScanResult triagedScan = HanziSweeperEngine.scanTriagedArtifacts(translatedChapters);
                    int remainingCount = triagedScan.totalUniqueCount();

                    if (triagedScan.isEmpty() || remainingCount == 0) {
                        mainHandler.post(() -> {
                            appendLog("🎉 [LÀM MƯỢT HOÀN TẤT 100%] Toàn bộ bản dịch đã sạch 100% tiếng Việt, không còn bất kỳ chữ Hán nào sót lại!");
                            Toast.makeText(MainActivity.this, "🎉 Bản dịch đã sạch 100% tiếng Việt!", Toast.LENGTH_LONG).show();
                        });
                        break;
                    }

                    // 2. Chia nhỏ thành các gói ~500 mục (~5.000 tokens)
                    List<HanziSweeperEngine.TriagedScanResult> chunks = HanziSweeperEngine.splitTriagedScan(triagedScan, 500);
                    int totalChunks = chunks.size();

                    mainHandler.post(() -> {
                        appendLog("⚡ [LÀM MƯỢT ĐỢT " + currentRound + "] Phát hiện " + remainingCount + " mục (Từ lai: " + triagedScan.mixedWords.size() + ", Cụm Hán: " + triagedScan.multiHanziWords.size() + ", Hán đơn: " + triagedScan.singleHanziContext.size() + "). Tự động chia làm " + totalChunks + " gói (~5.000 tokens/gói) gửi model " + targetPolishModel + "...");
                        Toast.makeText(MainActivity.this, "Đang xử lý đợt " + currentRound + ": " + remainingCount + " mục qua " + totalChunks + " gói...", Toast.LENGTH_SHORT).show();
                    });

                    int wordsFixedThisRound = 0;

                    for (int cIdx = 0; cIdx < totalChunks; cIdx++) {
                        HanziSweeperEngine.TriagedScanResult chunk = chunks.get(cIdx);
                        int currentChunkNumber = cIdx + 1;

                        mainHandler.post(() -> {
                            appendLog("⏳ [GÓI " + currentChunkNumber + "/" + totalChunks + "] Đang gửi " + chunk.totalUniqueCount() + " mục đến " + targetPolishModel + "...");
                        });

                        String batchPrompt = HanziSweeperEngine.buildTriagedPrompt(chunk);

                        String[] aiResponse = engine.translateChapter(
                                batchPrompt,
                                null,
                                "Bạn là chuyên gia dịch thuật tiểu thuyết và Hán Việt. Chỉ trả về JSON Object thuần túy.",
                                Collections.emptyMap(),
                                targetPolishModel,
                                "Tiếng Việt",
                                false,
                                2,
                                1,
                                null,
                                msg -> mainHandler.post(() -> appendLog(msg))
                        );

                        String rawJson = (aiResponse != null && aiResponse.length > 0) ? aiResponse[0] : "";
                        Map<String, String> translationMap = HanziSweeperEngine.parseJsonResponse(rawJson);

                        if (!translationMap.isEmpty()) {
                            int replacedCount = HanziSweeperEngine.applyGlobalReplacements(translatedChapters, translationMap);
                            wordsFixedThisRound += translationMap.size();
                            totalCumulativeFixedWords += translationMap.size();
                            totalCumulativeReplacements += replacedCount;

                            mainHandler.post(() -> {
                                updateProgressUI();
                                refreshChapterListView();
                                appendLog("✅ [GÓI " + currentChunkNumber + "/" + totalChunks + "] Đã làm mượt " + translationMap.size() + " từ (" + replacedCount + " vị trí).");
                            });
                        }
                    }

                    // Lưu dữ liệu sau mỗi đợt
                    saveCurrentProjectData();

                    // Nếu đợt này không sửa được từ nào (do AI lỗi hoặc mạng), dừng vòng lặp để tránh lặp vô tận
                    if (wordsFixedThisRound == 0) {
                        mainHandler.post(() -> {
                            appendLog("⚠️ Không thể trích xuất thêm bản dịch từ AI trong đợt này. Tạm dừng tiến trình.");
                        });
                        break;
                    }
                }

                // Cập nhật giao diện sau khi kết thúc toàn bộ vòng lặp
                final int finalFixed = totalCumulativeFixedWords;
                final int finalRepl = totalCumulativeReplacements;
                mainHandler.post(() -> {
                    updateProgressUI();
                    refreshChapterListView();
                    if (finalFixed > 0) {
                        appendLog("🏆 [TỔNG KẾT] Đã tự động làm mượt tổng cộng " + finalFixed + " từ rác (" + finalRepl + " vị trí) trên toàn bộ tác phẩm!");
                        Toast.makeText(MainActivity.this, "🎉 Hoàn tất làm mượt tổng cộng " + finalFixed + " từ rác!", Toast.LENGTH_LONG).show();
                    }
                });

            } catch (Exception e) {
                mainHandler.post(() -> {
                    appendLog("❌ Lỗi trong khâu làm mượt Final: " + e.getMessage());
                    Toast.makeText(MainActivity.this, "Lỗi làm mượt: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            } finally {
                isPolishing = false;
            }
        }).start();
    }

    private void updateProgressUI() {
        if (progressBar != null) {
            progressBar.setMax(Math.max(rawChapters.size(), 1));
            progressBar.setProgress(translatedChapters.size());
            tvProgressText.setText("Tiến độ: " + translatedChapters.size() + " / " + rawChapters.size() + " chương");
        }
    }

    private void appendLog(String msg) {
        mainHandler.post(() -> {
            String time = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(new java.util.Date());
            logList.add(0, "[" + time + "] " + msg);
            if (logList.size() > 50) logList.removeLast();

            if (tvLiveLogs != null) {
                String nl = String.valueOf((char) 10);
                StringBuilder sb = new StringBuilder();
                for (String l : logList) {
                    sb.append(l).append(nl);
                }
                tvLiveLogs.setText(sb.toString());
            }
        });
    }

    // =========================================================================
    // THẺ 3: BẢN DỊCH & DANH SÁCH CHƯƠNG (PHÂN TRANG MƯỢT MÀ 60FPS)
    // =========================================================================
    private void createTabReaderView() {
        tabReaderView = new ScrollView(this);
        tabReaderView.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(80));

        // CARD 1: THƯ VIỆN & CÔNG CỤ DỊCH BÙ
        LinearLayout cardToolbar = createCard();

        LinearLayout rowTab3Head = new LinearLayout(this);
        rowTab3Head.setOrientation(LinearLayout.HORIZONTAL);
        rowTab3Head.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvRdIcon = new TextView(this);
        tvRdIcon.setText("📚 ");
        tvRdIcon.setTextSize(15);
        rowTab3Head.addView(tvRdIcon);

        tvChapterCountInfo = new TextView(this);
        tvChapterCountInfo.setTextColor(Color.WHITE);
        tvChapterCountInfo.setTextSize(14.5f);
        tvChapterCountInfo.setTypeface(null, Typeface.BOLD);
        tvChapterCountInfo.setText("Kho Chương Đã Dịch & Trình Đọc AMOLED");
        rowTab3Head.addView(tvChapterCountInfo, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        rowTab3Head.addView(createHelpButton("chapter_auditor"));
        cardToolbar.addView(rowTab3Head);

        TextView tvDesc = new TextView(this);
        tvDesc.setText("Phân trang 100 chương/trang chống khựng máy. Trạng thái đọc độc lập 100%, hỗ trợ AMOLED/Sepia.");
        tvDesc.setTextColor(Color.parseColor("#64748B"));
        tvDesc.setTextSize(11f);
        tvDesc.setPadding(0, dp(6), 0, dp(12));
        cardToolbar.addView(tvDesc);

        Button btnExportTab3 = createGradientButton("📥 XUẤT TOÀN VĂN TÁC PHẨM (.TXT) VÀO DOWNLOAD", Color.parseColor("#059669"), Color.parseColor("#10B981"));
        btnExportTab3.setOnClickListener(v -> {
            triggerHaptic();
            exportFullNovelData();
        });
        cardToolbar.addView(btnExportTab3);

        btnFillGapsTab3 = createGradientButton("⚡ DỊCH BÙ TOÀN BỘ CHƯƠNG CÒN THIẾU (NÉ ĐÃ DỊCH)", Color.parseColor("#0D9488"), Color.parseColor("#14B8A6"));
        LinearLayout.LayoutParams fg3lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fg3lp.setMargins(0, dp(10), 0, 0);
        btnFillGapsTab3.setLayoutParams(fg3lp);
        btnFillGapsTab3.setOnClickListener(v -> {
            triggerHaptic();
            switchTab(1);
            startFillGapsTranslation();
        });
        cardToolbar.addView(btnFillGapsTab3);

        btnFinalPolishTab3 = createGradientButton("✨ LÀM MƯỢT TOÀN VĂN BẢN DỊCH (QUÉT SẠCH CHỮ HÁN)", Color.parseColor("#7C3AED"), Color.parseColor("#A855F7"));
        LinearLayout.LayoutParams fp3lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        fp3lp.setMargins(0, dp(10), 0, 0);
        btnFinalPolishTab3.setLayoutParams(fp3lp);
        btnFinalPolishTab3.setOnClickListener(v -> {
            triggerHaptic();
            executeFinalGlobalPolish();
        });
        cardToolbar.addView(btnFinalPolishTab3);
        content.addView(cardToolbar);

        // CARD 2: DANH SÁCH CHƯƠNG & PHÂN TRANG
        LinearLayout cardChapters = createCard();
        llChapterList = new LinearLayout(this);
        llChapterList.setOrientation(LinearLayout.VERTICAL);
        cardChapters.addView(llChapterList);
        content.addView(cardChapters);

        tabReaderView.addView(content);
        refreshChapterListView();
    }

    private void refreshChapterListView() {
        if (llChapterList == null) return;
        llChapterList.removeAllViews();

        if (rawChapters.isEmpty()) {
            TextView tvEmpty = new TextView(this);
            tvEmpty.setText("Chưa có chương nào. Hãy nạp file ở Thẻ 2 (Dịch & Từ điển)!");
            tvEmpty.setTextColor(Color.parseColor("#64748B"));
            tvEmpty.setTextSize(13f);
            tvEmpty.setGravity(Gravity.CENTER);
            tvEmpty.setPadding(0, dp(24), 0, dp(24));
            llChapterList.addView(tvEmpty);
            return;
        }

        int totalChapters = rawChapters.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalChapters / CHAPTERS_PER_PAGE));
        chapterListPage = Math.max(0, Math.min(chapterListPage, totalPages - 1));

        // Hàng điều khiển phân trang chương chống giật lag
        LinearLayout pagRow = new LinearLayout(this);
        pagRow.setOrientation(LinearLayout.HORIZONTAL);
        pagRow.setPadding(0, 0, 0, dp(12));
        pagRow.setGravity(Gravity.CENTER_VERTICAL);

        Button btnPrevPage = createButton("◀ TRƯỚC", "#1E293B");
        btnPrevPage.setTextSize(11f);
        btnPrevPage.setMinHeight(dp(38));
        btnPrevPage.setEnabled(chapterListPage > 0);
        btnPrevPage.setOnClickListener(v -> {
            if (chapterListPage > 0) {
                triggerHaptic();
                chapterListPage--;
                refreshChapterListView();
            }
        });
        pagRow.addView(btnPrevPage);

        TextView tvPageInfo = new TextView(this);
        tvPageInfo.setGravity(Gravity.CENTER);
        tvPageInfo.setTextColor(Color.parseColor("#38BDF8"));
        tvPageInfo.setTextSize(12.5f);
        tvPageInfo.setTypeface(null, Typeface.BOLD);
        tvPageInfo.setText("Trang " + (chapterListPage + 1) + " / " + totalPages + " (" + totalChapters + " chương)");
        pagRow.addView(tvPageInfo, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnNextPage = createButton("SAU ▶", "#1E293B");
        btnNextPage.setTextSize(11f);
        btnNextPage.setMinHeight(dp(38));
        btnNextPage.setEnabled(chapterListPage < totalPages - 1);
        btnNextPage.setOnClickListener(v -> {
            if (chapterListPage < totalPages - 1) {
                triggerHaptic();
                chapterListPage++;
                refreshChapterListView();
            }
        });
        pagRow.addView(btnNextPage);
        llChapterList.addView(pagRow);

        int startIdx = chapterListPage * CHAPTERS_PER_PAGE;
        int endIdx = Math.min(startIdx + CHAPTERS_PER_PAGE, totalChapters);

        for (int i = startIdx; i < endIdx; i++) {
            final int idx = i;
            boolean isDone = translatedChapters.containsKey(idx);
            boolean isCurrent = isTranslating && currentChapterIdx == idx;

            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.HORIZONTAL);
            item.setPadding(dp(14), dp(12), dp(14), dp(12));
            item.setGravity(Gravity.CENTER_VERTICAL);
            GradientDrawable itemBg = new GradientDrawable();
            itemBg.setColor(Color.parseColor(isCurrent ? "#172554" : (isDone ? "#0D1E16" : "#0E1624")));
            itemBg.setCornerRadius(dp(12));
            itemBg.setStroke(dp(1), Color.parseColor(isCurrent ? "#3B82F6" : (isDone ? "#059669" : "#1C2A40")));
            item.setBackground(itemBg);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, 0, dp(8));
            item.setLayoutParams(lp);

            TextView tvName = new TextView(this);
            String nl = String.valueOf((char) 10);
            String firstLine = rawChapters.get(idx).split(nl)[0];
            tvName.setText("Chương " + (idx + 1) + ": " + (firstLine.length() > 30 ? firstLine.substring(0, 30) : firstLine));
            tvName.setTextColor(Color.WHITE);
            tvName.setTextSize(13f);
            tvName.setTypeface(null, Typeface.BOLD);
            item.addView(tvName, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

            TextView tvStatus = new TextView(this);
            tvStatus.setText(isCurrent ? "⚡ Đang dịch" : (isDone ? "✓ Đã dịch" : "Chờ dịch"));
            tvStatus.setTextColor(Color.parseColor(isCurrent ? "#60A5FA" : (isDone ? "#34D399" : "#64748B")));
            tvStatus.setTextSize(10.5f);
            tvStatus.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            tvStatus.setPadding(dp(6), dp(3), dp(6), dp(3));
            GradientDrawable stBg = new GradientDrawable();
            stBg.setColor(Color.parseColor(isCurrent ? "#1E3A8A" : (isDone ? "#064E3B" : "#1E293B")));
            stBg.setCornerRadius(dp(6));
            stBg.setStroke(dp(1), Color.parseColor(isCurrent ? "#3B82F6" : (isDone ? "#10B981" : "#334155")));
            tvStatus.setBackground(stBg);
            item.addView(tvStatus);

            item.setOnClickListener(v -> {
                triggerHaptic();
                if (isDone) {
                    openFullScreenReader(idx);
                } else {
                    AlertDialog.Builder d = new AlertDialog.Builder(MainActivity.this);
                    d.setTitle("Chương " + (idx + 1) + " (Chưa có bản dịch)");
                    d.setMessage("Chương này đang ở trạng thái 'Chờ'.\n\nBạn có muốn dịch ngay chương này không?");
                    d.setPositiveButton("⚡ Dịch ngay chương này", (dialog, which) -> {
                        edtFromChap.setText(String.valueOf(idx + 1));
                        edtToChap.setText(String.valueOf(idx + 1));
                        switchTab(1);
                        startRangeTranslation();
                    });
                    d.setNeutralButton("Đọc bản gốc", (dialog, which) -> openFullScreenReader(idx));
                    d.setNegativeButton("Đóng", null);
                    d.show();
                }
            });
            llChapterList.addView(item);
        }
    }

    // =========================================================================
    // TRÌNH ĐỌC TOÀN MÀN HÌNH CHUYÊN NGHIỆP (FULLSCREEN READER OVERLAY)
    // =========================================================================
    private void createFullScreenReaderOverlay() {
        flReaderOverlay = new FrameLayout(this);
        flReaderOverlay.setVisibility(View.GONE);

        llReaderRoot = new LinearLayout(this);
        llReaderRoot.setOrientation(LinearLayout.VERTICAL);

        // 1. Reader Top Bar
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setPadding(28, 20, 28, 20);
        topBar.setGravity(Gravity.CENTER_VERTICAL);

        tvReaderTitle = new TextView(this);
        tvReaderTitle.setText("Chương 1");
        tvReaderTitle.setTextSize(15);
        tvReaderTitle.setTypeface(null, Typeface.BOLD);
        topBar.addView(tvReaderTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnCopy = createButton("Sao chép", "#1E293B");
        btnCopy.setOnClickListener(v -> {
            String textToCopy = getReaderCurrentText();
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Chapter Text", textToCopy));
                Toast.makeText(this, "Đã sao chép chương!", Toast.LENGTH_SHORT).show();
            }
        });
        topBar.addView(btnCopy);

        View spClose = new View(this);
        topBar.addView(spClose, new LinearLayout.LayoutParams(8, 1));

        Button btnClose = createButton("✕ Đóng", "#7F1D1D");
        btnClose.setOnClickListener(v -> flReaderOverlay.setVisibility(View.GONE));
        topBar.addView(btnClose);

        llReaderRoot.addView(topBar);

        // 2. Reader Secondary Toolbar (View Mode, Theme, Font Size)
        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setPadding(28, 10, 28, 10);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);

        // Chế độ xem: Tiếng Việt, Song Ngữ, Gốc
        btnModeTrans = createButton("Tiếng Việt", "#2563EB");
        btnModeTrans.setOnClickListener(v -> {
            readerMode = "translated";
            updateReaderUI();
        });
        toolbar.addView(btnModeTrans);

        View sm1 = new View(this);
        toolbar.addView(sm1, new LinearLayout.LayoutParams(6, 1));

        btnModeBilingual = createButton("Song Ngữ", "#1E293B");
        btnModeBilingual.setOnClickListener(v -> {
            readerMode = "bilingual";
            updateReaderUI();
        });
        toolbar.addView(btnModeBilingual);

        View sm2 = new View(this);
        toolbar.addView(sm2, new LinearLayout.LayoutParams(6, 1));

        btnModeRaw = createButton("Nguyên Tác", "#1E293B");
        btnModeRaw.setOnClickListener(v -> {
            readerMode = "original";
            updateReaderUI();
        });
        toolbar.addView(btnModeRaw);

        View sSpace = new View(this);
        toolbar.addView(sSpace, new LinearLayout.LayoutParams(0, 1, 1.0f));

        // Chủ đề: AMOLED, Sepia, Sáng
        btnThemeAmoled = createButton("AMOLED", "#000000");
        btnThemeAmoled.setOnClickListener(v -> {
            readerTheme = "amoled";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeAmoled);

        View st1 = new View(this);
        toolbar.addView(st1, new LinearLayout.LayoutParams(6, 1));

        btnThemeSepia = createButton("Sepia", "#D97706");
        btnThemeSepia.setOnClickListener(v -> {
            readerTheme = "sepia";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeSepia);

        View st2 = new View(this);
        toolbar.addView(st2, new LinearLayout.LayoutParams(6, 1));

        btnThemeLight = createButton("Sáng", "#4B5563");
        btnThemeLight.setOnClickListener(v -> {
            readerTheme = "light";
            applyReaderTheme();
        });
        toolbar.addView(btnThemeLight);

        View sFontSpace = new View(this);
        toolbar.addView(sFontSpace, new LinearLayout.LayoutParams(12, 1));

        // Nút chỉnh cỡ chữ
        Button btnFontMinus = createButton("A-", "#1E293B");
        btnFontMinus.setOnClickListener(v -> {
            readerFontSize = Math.max(12, readerFontSize - 1);
            tvFontSizeDisplay.setText(readerFontSize + "sp");
            tvReaderContent.setTextSize(readerFontSize);
        });
        toolbar.addView(btnFontMinus);

        tvFontSizeDisplay = new TextView(this);
        tvFontSizeDisplay.setText(readerFontSize + "sp");
        tvFontSizeDisplay.setTextSize(11);
        tvFontSizeDisplay.setPadding(8, 0, 8, 0);
        toolbar.addView(tvFontSizeDisplay);

        Button btnFontPlus = createButton("A+", "#1E293B");
        btnFontPlus.setOnClickListener(v -> {
            readerFontSize = Math.min(26, readerFontSize + 1);
            tvFontSizeDisplay.setText(readerFontSize + "sp");
            tvReaderContent.setTextSize(readerFontSize);
        });
        toolbar.addView(btnFontPlus);

        llReaderRoot.addView(toolbar);

        // 3. Reader Content Body
        svReaderScroll = new ScrollView(this);
        LinearLayout.LayoutParams svParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1.0f
        );

        tvReaderContent = new TextView(this);
        tvReaderContent.setPadding(36, 24, 36, 32);
        tvReaderContent.setTextSize(readerFontSize);
        tvReaderContent.setLineSpacing(0, 1.6f);
        tvReaderContent.setTextIsSelectable(true);

        svReaderScroll.addView(tvReaderContent);
        llReaderRoot.addView(svReaderScroll, svParams);

        // 4. Reader Bottom Bar (Chương Trước / Sau)
        LinearLayout bottomBar = new LinearLayout(this);
        bottomBar.setOrientation(LinearLayout.HORIZONTAL);
        bottomBar.setPadding(28, 16, 28, 20);
        bottomBar.setGravity(Gravity.CENTER_VERTICAL);

        btnPrevChapter = createButton("← Chương Trước", "#1E293B");
        btnPrevChapter.setOnClickListener(v -> {
            if (readerCurrentChapterIndex > 0) {
                openFullScreenReader(readerCurrentChapterIndex - 1);
            }
        });
        bottomBar.addView(btnPrevChapter);

        tvReaderSubTitle = new TextView(this);
        tvReaderSubTitle.setGravity(Gravity.CENTER);
        bottomBar.addView(tvReaderSubTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        btnNextChapter = createButton("Chương Sau →", "#1E293B");
        btnNextChapter.setOnClickListener(v -> {
            if (readerCurrentChapterIndex < rawChapters.size() - 1) {
                openFullScreenReader(readerCurrentChapterIndex + 1);
            }
        });
        bottomBar.addView(btnNextChapter);

        llReaderRoot.addView(bottomBar);

        flReaderOverlay.addView(llReaderRoot, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        applyReaderTheme();
    }

    private void openFullScreenReader(int index) {
        if (rawChapters.isEmpty()) return;
        readerCurrentChapterIndex = Math.max(0, Math.min(index, rawChapters.size() - 1));

        tvReaderTitle.setText(currentProjectName + " · Chương " + (readerCurrentChapterIndex + 1) + " / " + rawChapters.size());
        tvReaderSubTitle.setText((readerCurrentChapterIndex + 1) + " / " + rawChapters.size());

        btnPrevChapter.setEnabled(readerCurrentChapterIndex > 0);
        btnNextChapter.setEnabled(readerCurrentChapterIndex < rawChapters.size() - 1);

        updateReaderUI();

        flReaderOverlay.setVisibility(View.VISIBLE);
        svReaderScroll.scrollTo(0, 0);
    }

    private String getReaderCurrentText() {
        if (rawChapters.isEmpty() || readerCurrentChapterIndex >= rawChapters.size()) return "";

        String nl = String.valueOf((char) 10);
        boolean hasTrans = translatedChapters.containsKey(readerCurrentChapterIndex);
        String transText = hasTrans ? translatedChapters.get(readerCurrentChapterIndex) : "(Chưa có bản dịch cho chương này)";
        String rawText = rawChapters.get(readerCurrentChapterIndex);

        if ("translated".equals(readerMode)) {
            return transText;
        } else if ("original".equals(readerMode)) {
            return rawText;
        } else {
            return "=== BẢN DỊCH TIẾNG VIỆT ===" + nl + nl + transText + nl + nl + "=== NGUYÊN TÁC GỐC ===" + nl + nl + rawText;
        }
    }

    private void updateReaderUI() {
        tvReaderContent.setText(getReaderCurrentText());

        btnModeTrans.setBackgroundColor(Color.parseColor("translated".equals(readerMode) ? "#2563EB" : "#1E293B"));
        btnModeBilingual.setBackgroundColor(Color.parseColor("bilingual".equals(readerMode) ? "#2563EB" : "#1E293B"));
        btnModeRaw.setBackgroundColor(Color.parseColor("original".equals(readerMode) ? "#2563EB" : "#1E293B"));
    }

    private void applyReaderTheme() {
        int bgColor;
        int textColor;
        int barBgColor;

        if ("sepia".equals(readerTheme)) {
            bgColor = Color.parseColor("#FBF0D9");
            textColor = Color.parseColor("#3D2E1E");
            barBgColor = Color.parseColor("#F2E2C2");
        } else if ("light".equals(readerTheme)) {
            bgColor = Color.parseColor("#FFFFFF");
            textColor = Color.parseColor("#111827");
            barBgColor = Color.parseColor("#F3F4F6");
        } else { // amoled
            bgColor = Color.parseColor("#000000");
            textColor = Color.parseColor("#E5E7EB");
            barBgColor = Color.parseColor("#111111");
        }

        llReaderRoot.setBackgroundColor(bgColor);
        tvReaderContent.setTextColor(textColor);
        tvReaderTitle.setTextColor(textColor);
        tvReaderSubTitle.setTextColor(textColor);
        tvFontSizeDisplay.setTextColor(textColor);
    }

    // =========================================================================
    // =========================================================================
    // THẺ 4: CÀI ĐẶT CHUYÊN SÂU & QUẢN LÝ DỰ ÁN (DEEP SETTINGS HUB)
    // =========================================================================
    private void refreshSettingsUI() {
        if (tvSettingsProjName != null) {
            tvSettingsProjName.setText("• Dự án: " + currentProjectName);
        }
        if (tvSettingsProjStats != null) {
            tvSettingsProjStats.setText("• Đã dịch: " + translatedChapters.size() + "/" + rawChapters.size() + " chương · Glossary: " + masterGlossary.size() + " từ");
        }
        if (tvSettingsMinTerm != null) {
            tvSettingsMinTerm.setText("• Độ dài chữ Hán tối thiểu: " + minTermLength + " ký tự");
        }
        if (edtCustomMinTerm != null && !edtCustomMinTerm.hasFocus()) {
            edtCustomMinTerm.setText(String.valueOf(minTermLength));
        }
        if (tvSettingsMinFreq != null) {
            tvSettingsMinFreq.setText("• Tần suất lặp lại tối thiểu trong chương: ≥ " + minFrequency + " lần");
        }
        if (edtCustomMinFreq != null && !edtCustomMinFreq.hasFocus()) {
            edtCustomMinFreq.setText(String.valueOf(minFrequency));
        }
        if (tvSettingsTargetLang != null) {
            tvSettingsTargetLang.setText("• Ngôn ngữ đích: " + targetLanguage);
        }

        updateLangButtonStyles();
        updateMinTermButtonStyles();
        updateMinFreqButtonStyles();

        if (btnSettingsAntiHanzi != null) {
            btnSettingsAntiHanzi.setText("Bộ Lọc 2 Lớp Chống Chữ Hán: " + (antiHanziStrict ? "🟢 BẬT [Lớp 1 + Lớp 2]" : "⚪ TẮT"));
            btnSettingsAntiHanzi.setBackground(createButtonDrawable(antiHanziStrict ? "#059669" : "#374151", 18f));
        }
        if (btnSettingsAutoHeal != null) {
            btnSettingsAutoHeal.setText("Tự Động Dịch Lại Khi Lỗi Nặng: " + (autoHealOnlineEnabled ? "🟢 BẬT [Auto-Heal Online]" : "⚪ TẮT"));
            btnSettingsAutoHeal.setBackground(createButtonDrawable(autoHealOnlineEnabled ? "#0D9488" : "#374151", 18f));
        }
        if (btnSettingsPolicy != null) {
            btnSettingsPolicy.setText("Xung Đột Nghĩa: " + ("keep-old".equals(conflictPolicy) ? "Giữ Cũ - Bỏ Mới (Bảo toàn)" : "Ghi Đè Bằng Nghĩa Mới"));
        }
    }

    private void updateLangButtonStyles() {
        if (btnLangVi == null) return;
        boolean isVi = targetLanguage.contains("Việt");
        boolean isJa = targetLanguage.contains("Nhật") || targetLanguage.contains("日本語");
        boolean isEn = targetLanguage.equalsIgnoreCase("English");
        boolean isKo = targetLanguage.contains("Hàn") || targetLanguage.contains("한국어");

        btnLangVi.setText((isVi ? "✓ " : "") + "Tiếng Việt");
        btnLangJa.setText((isJa ? "✓ " : "") + "日本語");
        btnLangEn.setText((isEn ? "✓ " : "") + "English");
        btnLangKo.setText((isKo ? "✓ " : "") + "한국어");

        btnLangVi.setBackground(createButtonDrawable(isVi ? "#1D4ED8" : "#1E293B", 14f));
        btnLangJa.setBackground(createButtonDrawable(isJa ? "#1D4ED8" : "#1E293B", 14f));
        btnLangEn.setBackground(createButtonDrawable(isEn ? "#1D4ED8" : "#1E293B", 14f));
        btnLangKo.setBackground(createButtonDrawable(isKo ? "#1D4ED8" : "#1E293B", 14f));
    }

    private void updateMinTermButtonStyles() {
        for (int i = 0; i < minTermButtons.size(); i++) {
            int len = i + 1;
            Button b = minTermButtons.get(i);
            b.setBackground(createButtonDrawable(minTermLength == len ? "#059669" : "#1E293B", 12f));
        }
    }

    private void updateMinFreqButtonStyles() {
        for (int i = 0; i < minFreqButtons.size(); i++) {
            int freq = i + 1;
            Button b = minFreqButtons.get(i);
            b.setBackground(createButtonDrawable(minFrequency == freq ? "#059669" : "#1E293B", 12f));
        }
    }

    private void createTabSettingsView() {
        tabSettingsView = new ScrollView(this);
        tabSettingsView.setOverScrollMode(View.OVER_SCROLL_ALWAYS);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(16), dp(16), dp(16), dp(80));

        // 1. Quản Lý Dự Án & Xóa Dự Án
        LinearLayout rowS1Head = new LinearLayout(this);
        rowS1Head.setOrientation(LinearLayout.HORIZONTAL);
        rowS1Head.setGravity(Gravity.CENTER_VERTICAL);

        TextView tvPrIcon = new TextView(this);
        tvPrIcon.setText("⚙️ ");
        tvPrIcon.setTextSize(15);
        rowS1Head.addView(tvPrIcon);

        TextView tvProjTitle = new TextView(this);
        tvProjTitle.setText("Quản Lý Dự Án Hiện Tại");
        tvProjTitle.setTextColor(Color.WHITE);
        tvProjTitle.setTextSize(14.5f);
        tvProjTitle.setTypeface(null, Typeface.BOLD);
        rowS1Head.addView(tvProjTitle);
        rowS1Head.addView(createHelpButton("settings_projects_manager"));
        content.addView(rowS1Head);

        LinearLayout cardProj = createCard();
        tvSettingsProjName = new TextView(this);
        tvSettingsProjName.setText("• Dự án: " + currentProjectName);
        tvSettingsProjName.setTextColor(Color.parseColor("#38BDF8"));
        tvSettingsProjName.setTextSize(14f);
        tvSettingsProjName.setTypeface(null, Typeface.BOLD);
        cardProj.addView(tvSettingsProjName);

        tvSettingsProjStats = new TextView(this);
        tvSettingsProjStats.setText("• Đã dịch: " + translatedChapters.size() + "/" + rawChapters.size() + " chương · Glossary: " + masterGlossary.size() + " từ");
        tvSettingsProjStats.setTextColor(Color.parseColor("#94A3B8"));
        tvSettingsProjStats.setTextSize(12f);
        tvSettingsProjStats.setPadding(0, dp(4), 0, dp(12));
        cardProj.addView(tvSettingsProjStats);

        LinearLayout rowProjBtns = new LinearLayout(this);
        rowProjBtns.setOrientation(LinearLayout.HORIZONTAL);

        Button btnSwitch = createButton("CHUYỂN DỰ ÁN", "#1E293B");
        btnSwitch.setMinHeight(dp(44));
        btnSwitch.setOnClickListener(v -> {
            triggerHaptic();
            showSwitchProjectDialog();
        });
        rowProjBtns.addView(btnSwitch, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        Button btnNewProj = createGradientButton("+ TẠO MỚI", Color.parseColor("#0284C7"), Color.parseColor("#00D2FF"));
        btnNewProj.setMinHeight(dp(44));
        LinearLayout.LayoutParams nplp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        nplp.leftMargin = dp(8);
        btnNewProj.setLayoutParams(nplp);
        btnNewProj.setOnClickListener(v -> {
            triggerHaptic();
            showNewProjectDialog();
        });
        rowProjBtns.addView(btnNewProj);

        cardProj.addView(rowProjBtns);

        // Nút Xóa Dự Án Màu Đỏ Ruby Cực Kỳ An Toàn
        Button btnDeleteProj = createButton("🗑️ XÓA VĨNH VIỄN DỰ ÁN NÀY", "#7F1D1D");
        btnDeleteProj.setMinHeight(dp(46));
        btnDeleteProj.setOnClickListener(v -> {
            triggerHaptic();
            showDeleteProjectConfirmationDialog();
        });
        LinearLayout.LayoutParams lpDel = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lpDel.setMargins(0, dp(10), 0, 0);
        cardProj.addView(btnDeleteProj, lpDel);

        TextView tvDelHint = new TextView(this);
        tvDelHint.setText("💡 Khi xóa dự án, chỉ dữ liệu của truyện này bị xóa. Toàn bộ kho Key API và Thẻ Prompt ở Tab 1 được BẢO TOÀN VĨNH CỬU 100%.");
        tvDelHint.setTextColor(Color.parseColor("#64748B"));
        tvDelHint.setTextSize(10.5f);
        tvDelHint.setPadding(0, dp(8), 0, 0);
        cardProj.addView(tvDelHint);

        content.addView(cardProj);

        // 2. Tinh Chỉnh Glossary AI Auto-Learning
        LinearLayout rowS2Head = new LinearLayout(this);
        rowS2Head.setOrientation(LinearLayout.HORIZONTAL);
        rowS2Head.setGravity(Gravity.CENTER_VERTICAL);
        rowS2Head.setPadding(0, 16, 0, 0);
        TextView tvGlossSettingsTitle = new TextView(this);
        tvGlossSettingsTitle.setText("2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning):");
        tvGlossSettingsTitle.setTextColor(Color.WHITE);
        tvGlossSettingsTitle.setTextSize(15);
        tvGlossSettingsTitle.setTypeface(null, Typeface.BOLD);
        rowS2Head.addView(tvGlossSettingsTitle);
        rowS2Head.addView(createHelpButton("settings_glossary_learning"));
        content.addView(rowS2Head);

        LinearLayout cardGloss = createCard();
        tvSettingsMinTerm = new TextView(this);
        tvSettingsMinTerm.setText("• Độ dài chữ Hán tối thiểu: " + minTermLength + " ký tự");
        tvSettingsMinTerm.setTextColor(Color.parseColor("#D1D5DB"));
        cardGloss.addView(tvSettingsMinTerm);

        // Quick buttons cho Độ dài (1 đến 6 ký tự)
        minTermButtons.clear();
        LinearLayout rowLen = new LinearLayout(this);
        rowLen.setOrientation(LinearLayout.HORIZONTAL);
        rowLen.setPadding(0, 8, 0, 8);
        for (int l = 1; l <= 6; l++) {
            final int chosenLen = l;
            Button b = createButton(l + " kt", minTermLength == l ? "#059669" : "#1E293B");
            b.setOnClickListener(v -> {
                minTermLength = chosenLen;
                if (edtCustomMinTerm != null) edtCustomMinTerm.setText(String.valueOf(chosenLen));
                saveAllState();
                refreshSettingsUI();
                appendLog("⚙️ Đã đặt Độ dài Glossary tối thiểu: >= " + chosenLen + " ký tự");
            });
            minTermButtons.add(b);
            rowLen.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
            if (l < 6) {
                View s = new View(this);
                rowLen.addView(s, new LinearLayout.LayoutParams(6, 1));
            }
        }
        cardGloss.addView(rowLen);

        // Nhập số tùy ý cho Độ dài
        LinearLayout rowCustomMinTerm = new LinearLayout(this);
        rowCustomMinTerm.setOrientation(LinearLayout.HORIZONTAL);
        rowCustomMinTerm.setGravity(Gravity.CENTER_VERTICAL);
        rowCustomMinTerm.setPadding(0, 0, 0, 14);

        TextView tvCustomTermLabel = new TextView(this);
        tvCustomTermLabel.setText("Hoặc nhập số tùy ý:");
        tvCustomTermLabel.setTextColor(Color.parseColor("#9CA3AF"));
        tvCustomTermLabel.setTextSize(12);
        rowCustomMinTerm.addView(tvCustomTermLabel);

        View sct1 = new View(this);
        rowCustomMinTerm.addView(sct1, new LinearLayout.LayoutParams(10, 1));

        edtCustomMinTerm = new EditText(this);
        edtCustomMinTerm.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        edtCustomMinTerm.setText(String.valueOf(minTermLength));
        edtCustomMinTerm.setTextColor(Color.WHITE);
        edtCustomMinTerm.setBackgroundColor(Color.parseColor("#171717"));
        edtCustomMinTerm.setPadding(20, 12, 20, 12);
        edtCustomMinTerm.setGravity(Gravity.CENTER);
        rowCustomMinTerm.addView(edtCustomMinTerm, new LinearLayout.LayoutParams(140, ViewGroup.LayoutParams.WRAP_CONTENT));

        View sct2 = new View(this);
        rowCustomMinTerm.addView(sct2, new LinearLayout.LayoutParams(10, 1));

        Button btnSaveCustomTerm = createButton("Lưu số này", "#059669");
        btnSaveCustomTerm.setOnClickListener(v -> {
            try {
                int val = Integer.parseInt(edtCustomMinTerm.getText().toString().trim());
                if (val >= 1) {
                    minTermLength = val;
                    saveAllState();
                    refreshSettingsUI();
                    appendLog("⚙️ Đã lưu Độ dài Glossary tối thiểu: >= " + minTermLength + " ký tự");
                    Toast.makeText(this, "Đã lưu độ dài tối thiểu: " + minTermLength + " ký tự!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, "Vui lòng nhập số >= 1!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Vui lòng nhập số hợp lệ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowCustomMinTerm.addView(btnSaveCustomTerm);
        cardGloss.addView(rowCustomMinTerm);

        // Tần suất xuất hiện tối thiểu
        tvSettingsMinFreq = new TextView(this);
        tvSettingsMinFreq.setText("• Tần suất lặp lại tối thiểu trong chương: ≥ " + minFrequency + " lần");
        tvSettingsMinFreq.setTextColor(Color.parseColor("#D1D5DB"));
        cardGloss.addView(tvSettingsMinFreq);

        minFreqButtons.clear();
        LinearLayout rowFreq = new LinearLayout(this);
        rowFreq.setOrientation(LinearLayout.HORIZONTAL);
        rowFreq.setPadding(0, 8, 0, 8);
        for (int f = 1; f <= 6; f++) {
            final int chosenFreq = f;
            Button b = createButton("≥ " + f + " lần", minFrequency == f ? "#059669" : "#1E293B");
            b.setOnClickListener(v -> {
                minFrequency = chosenFreq;
                if (edtCustomMinFreq != null) edtCustomMinFreq.setText(String.valueOf(chosenFreq));
                saveAllState();
                refreshSettingsUI();
                appendLog("⚙️ Đã đặt Tần suất Glossary tối thiểu: >= " + chosenFreq + " lần");
            });
            minFreqButtons.add(b);
            rowFreq.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
            if (f < 6) {
                View s = new View(this);
                rowFreq.addView(s, new LinearLayout.LayoutParams(6, 1));
            }
        }
        cardGloss.addView(rowFreq);

        // Nhập số tùy ý cho Tần suất
        LinearLayout rowCustomMinFreq = new LinearLayout(this);
        rowCustomMinFreq.setOrientation(LinearLayout.HORIZONTAL);
        rowCustomMinFreq.setGravity(Gravity.CENTER_VERTICAL);
        rowCustomMinFreq.setPadding(0, 0, 0, 14);

        TextView tvCustomFreqLabel = new TextView(this);
        tvCustomFreqLabel.setText("Hoặc nhập số tùy ý:");
        tvCustomFreqLabel.setTextColor(Color.parseColor("#9CA3AF"));
        tvCustomFreqLabel.setTextSize(12);
        rowCustomMinFreq.addView(tvCustomFreqLabel);

        View scf1 = new View(this);
        rowCustomMinFreq.addView(scf1, new LinearLayout.LayoutParams(10, 1));

        edtCustomMinFreq = new EditText(this);
        edtCustomMinFreq.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        edtCustomMinFreq.setText(String.valueOf(minFrequency));
        edtCustomMinFreq.setTextColor(Color.WHITE);
        edtCustomMinFreq.setBackgroundColor(Color.parseColor("#171717"));
        edtCustomMinFreq.setPadding(20, 12, 20, 12);
        edtCustomMinFreq.setGravity(Gravity.CENTER);
        rowCustomMinFreq.addView(edtCustomMinFreq, new LinearLayout.LayoutParams(140, ViewGroup.LayoutParams.WRAP_CONTENT));

        View scf2 = new View(this);
        rowCustomMinFreq.addView(scf2, new LinearLayout.LayoutParams(10, 1));

        Button btnSaveCustomFreq = createButton("Lưu số này", "#059669");
        btnSaveCustomFreq.setOnClickListener(v -> {
            try {
                int val = Integer.parseInt(edtCustomMinFreq.getText().toString().trim());
                if (val >= 1) {
                    minFrequency = val;
                    saveAllState();
                    refreshSettingsUI();
                    appendLog("⚙️ Đã lưu Tần suất Glossary tối thiểu: >= " + minFrequency + " lần");
                    Toast.makeText(this, "Đã lưu tần suất tối thiểu: " + minFrequency + " lần!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(this, "Vui lòng nhập số >= 1!", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(this, "Vui lòng nhập số hợp lệ!", Toast.LENGTH_SHORT).show();
            }
        });
        rowCustomMinFreq.addView(btnSaveCustomFreq);
        cardGloss.addView(rowCustomMinFreq);

        btnSettingsPolicy = createButton("Xung Đột Nghĩa: " + ("keep-old".equals(conflictPolicy) ? "Giữ Cũ - Bỏ Mới (Bảo toàn)" : "Ghi Đè Bằng Nghĩa Mới"), "#1E293B");
        btnSettingsPolicy.setOnClickListener(v -> {
            conflictPolicy = "keep-old".equals(conflictPolicy) ? "overwrite" : "keep-old";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Đã chuyển chính sách xung đột: " + conflictPolicy);
        });
        cardGloss.addView(btnSettingsPolicy);

        content.addView(cardGloss);

        // 3. Dịch Thuật & Chống Lọt Chữ Hán
        LinearLayout rowS3Head = new LinearLayout(this);
        rowS3Head.setOrientation(LinearLayout.HORIZONTAL);
        rowS3Head.setGravity(Gravity.CENTER_VERTICAL);
        rowS3Head.setPadding(0, 16, 0, 0);
        TextView tvTransTitle = new TextView(this);
        tvTransTitle.setText("3. Dịch Thuật & Chống Lọt Chữ Hán (2 Lớp):");
        tvTransTitle.setTextColor(Color.WHITE);
        tvTransTitle.setTextSize(15);
        tvTransTitle.setTypeface(null, Typeface.BOLD);
        rowS3Head.addView(tvTransTitle);
        rowS3Head.addView(createHelpButton("settings_translation_anti_hanzi"));
        content.addView(rowS3Head);

        LinearLayout cardTrans = createCard();
        tvSettingsTargetLang = new TextView(this);
        tvSettingsTargetLang.setText("• Ngôn ngữ đích: " + targetLanguage);
        tvSettingsTargetLang.setTextColor(Color.parseColor("#93C5FD"));
        cardTrans.addView(tvSettingsTargetLang);

        LinearLayout rowLangs = new LinearLayout(this);
        rowLangs.setOrientation(LinearLayout.HORIZONTAL);
        rowLangs.setPadding(0, 8, 0, 12);

        btnLangVi = createButton("Tiếng Việt", targetLanguage.contains("Việt") ? "#2563EB" : "#1E293B");
        btnLangVi.setOnClickListener(v -> {
            targetLanguage = "Tiếng Việt";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: Tiếng Việt (Kích hoạt bộ lọc cấm chữ Hán)");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: Tiếng Việt", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangVi, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL1 = new View(this);
        rowLangs.addView(spL1, new LinearLayout.LayoutParams(6, 1));

        btnLangJa = createButton("日本語", targetLanguage.contains("Nhật") || targetLanguage.contains("日本語") ? "#2563EB" : "#1E293B");
        btnLangJa.setOnClickListener(v -> {
            targetLanguage = "日本語";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: 日本語 (Thả lỏng cho phép sinh Kanji mượt mà)");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: 日本語 (Tiếng Nhật)", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangJa, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL2 = new View(this);
        rowLangs.addView(spL2, new LinearLayout.LayoutParams(6, 1));

        btnLangEn = createButton("English", targetLanguage.equalsIgnoreCase("English") ? "#2563EB" : "#1E293B");
        btnLangEn.setOnClickListener(v -> {
            targetLanguage = "English";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: English");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: English", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangEn, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        View spL3 = new View(this);
        rowLangs.addView(spL3, new LinearLayout.LayoutParams(6, 1));

        btnLangKo = createButton("한국어", targetLanguage.contains("한국어") || targetLanguage.contains("Hàn") ? "#2563EB" : "#1E293B");
        btnLangKo.setOnClickListener(v -> {
            targetLanguage = "한국어";
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Ngôn ngữ đích: 한국어");
            Toast.makeText(this, "Đã chọn ngôn ngữ đích: 한국어", Toast.LENGTH_SHORT).show();
        });
        rowLangs.addView(btnLangKo, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));

        cardTrans.addView(rowLangs);

        btnSettingsAntiHanzi = createButton("Bộ Lọc 2 Lớp Chống Chữ Hán: " + (antiHanziStrict ? "🟢 BẬT [Lớp 1 + Lớp 2]" : "⚪ TẮT"), antiHanziStrict ? "#059669" : "#374151");
        btnSettingsAntiHanzi.setOnClickListener(v -> {
            antiHanziStrict = !antiHanziStrict;
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Bộ lọc chống lọt chữ Hán: " + (antiHanziStrict ? "BẬT" : "TẮT"));
        });
        cardTrans.addView(btnSettingsAntiHanzi);

        View spBetween = new View(this);
        cardTrans.addView(spBetween, new LinearLayout.LayoutParams(1, 10));

        btnSettingsAutoHeal = createButton("Tự Động Dịch Lại Khi Lỗi Nặng: " + (autoHealOnlineEnabled ? "🟢 BẬT [Auto-Heal Online]" : "⚪ TẮT"), autoHealOnlineEnabled ? "#0D9488" : "#374151");
        btnSettingsAutoHeal.setOnClickListener(v -> {
            autoHealOnlineEnabled = !autoHealOnlineEnabled;
            saveAllState();
            refreshSettingsUI();
            appendLog("⚙️ Cơ chế Tự Động Dịch Lại & Ghi Đè khi lỗi nặng: " + (autoHealOnlineEnabled ? "BẬT" : "TẮT"));
        });
        cardTrans.addView(btnSettingsAutoHeal);

        content.addView(cardTrans);

        // 4. Trạng Thái 5 Tầng Chạy Ngầm (God-Mode)
        LinearLayout rowS4Head = new LinearLayout(this);
        rowS4Head.setOrientation(LinearLayout.HORIZONTAL);
        rowS4Head.setGravity(Gravity.CENTER_VERTICAL);
        rowS4Head.setPadding(0, 16, 0, 0);
        TextView tvTitle = new TextView(this);
        tvTitle.setText("4. Trạng Thái 5 Tầng Chạy Ngầm (God-Mode):");
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(15);
        tvTitle.setTypeface(null, Typeface.BOLD);
        rowS4Head.addView(tvTitle);
        rowS4Head.addView(createHelpButton("settings_god_mode"));
        content.addView(rowS4Head);

        LinearLayout cardStatus = createCard();
        cardStatus.addView(createStatusRow("1. Foreground Service (DataSync)", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("2. CPU Partial WakeLock (12 Giờ)", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("3. Bỏ Qua Tối Ưu Hóa Pin", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("4. WorkManager Periodic Watchdog", "KÍCH HOẠT"));
        cardStatus.addView(createStatusRow("5. Root Mode (OOM Score -1000)", RootController.isRootAvailable() ? "BẤT TỬ (ROOT #)" : "CHƯA CẤP ROOT"));
        content.addView(cardStatus);

        // Tinh chỉnh tốc độ dịch
        TextView tvDelayTitle = new TextView(this);
        tvDelayTitle.setText("Độ trễ an toàn giữa các chương (giây):");
        tvDelayTitle.setTextColor(Color.WHITE);
        tvDelayTitle.setPadding(0, 16, 0, 8);
        content.addView(tvDelayTitle);

        EditText edtDelay = new EditText(this);
        edtDelay.setText(String.valueOf(delaySec));
        edtDelay.setTextColor(Color.WHITE);
        edtDelay.setBackgroundColor(Color.parseColor("#171717"));
        edtDelay.setPadding(16, 12, 16, 12);
        content.addView(edtDelay);

        Button btnSaveDelay = createButton("Lưu Độ Trễ", "#1E293B");
        btnSaveDelay.setOnClickListener(v -> {
            try {
                delaySec = Math.max(1, Integer.parseInt(edtDelay.getText().toString().trim()));
                saveAllState();
                Toast.makeText(this, "Đã lưu độ trễ: " + delaySec + "s", Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
        content.addView(btnSaveDelay);

        // 5. Cấu hình Model Làm Mượt Bản Dịch Final (Global Polish Model)
        LinearLayout rowS5Head = new LinearLayout(this);
        rowS5Head.setOrientation(LinearLayout.HORIZONTAL);
        rowS5Head.setGravity(Gravity.CENTER_VERTICAL);
        rowS5Head.setPadding(0, 16, 0, 0);
        TextView tvPolishModelTitle = new TextView(this);
        tvPolishModelTitle.setText("5. Model Dùng Cho Khâu Làm Mượt Final:");
        tvPolishModelTitle.setTextColor(Color.WHITE);
        tvPolishModelTitle.setTextSize(15);
        tvPolishModelTitle.setTypeface(null, Typeface.BOLD);
        rowS5Head.addView(tvPolishModelTitle);
        rowS5Head.addView(createHelpButton("settings_api_rotation"));
        content.addView(rowS5Head);

        LinearLayout cardPolishModel = createCard();
        TextView tvCurPolishModel = new TextView(this);
        tvCurPolishModel.setText("• Model làm mượt đang chọn: " + polishModel);
        tvCurPolishModel.setTextColor(Color.parseColor("#C084FC"));
        tvCurPolishModel.setPadding(0, 0, 0, 8);
        cardPolishModel.addView(tvCurPolishModel);

        String[] pModels = {"gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"};
        LinearLayout rowPM = new LinearLayout(this);
        rowPM.setOrientation(LinearLayout.HORIZONTAL);
        for (String pm : pModels) {
            String label = pm.replace("gemini-", "");
            Button b = createButton(label, polishModel.equals(pm) ? "#7C3AED" : "#1E293B");
            b.setOnClickListener(v -> {
                polishModel = pm;
                saveAllState();
                tvCurPolishModel.setText("• Model làm mượt đang chọn: " + polishModel);
                appendLog("⚙️ Đã đổi Model Làm Mượt Final: " + polishModel);
                Toast.makeText(this, "Đã chọn " + pm + " cho khâu làm mượt", Toast.LENGTH_SHORT).show();
            });
            rowPM.addView(b, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        }
        cardPolishModel.addView(rowPM);
        content.addView(cardPolishModel);

        // Xuất toàn văn tác phẩm
        LinearLayout rowExp = new LinearLayout(this);
        rowExp.setOrientation(LinearLayout.HORIZONTAL);
        rowExp.setGravity(Gravity.CENTER_VERTICAL);
        rowExp.setPadding(0, 12, 0, 0);

        Button btnExport = createButton("📥 Xuất Toàn Văn Tác Phẩm (.txt)", "#059669");
        btnExport.setOnClickListener(v -> exportFullNovelData());
        rowExp.addView(btnExport, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        rowExp.addView(createHelpButton("export_full_txt"));
        content.addView(rowExp);

        tabSettingsView.addView(content);
    }

    private void exportFullNovelData() {
        if (translatedChapters.isEmpty()) {
            Toast.makeText(this, "Chưa có chương nào được dịch để xuất!", Toast.LENGTH_SHORT).show();
            return;
        }

        String nl = String.valueOf((char) 10);
        StringBuilder sb = new StringBuilder();
        sb.append("=== TOÀN VĂN TÁC PHẨM: ").append(currentProjectName).append(" ===").append(nl);
        sb.append("Biên dịch bởi: DroidTranslator God-Mode").append(nl);
        sb.append("Mô hình: ").append(currentModel).append(nl);
        sb.append("Tổng số chương đã dịch: ").append(translatedChapters.size()).append(nl).append(nl);

        List<Integer> keys = new ArrayList<>(translatedChapters.keySet());
        Collections.sort(keys);
        for (Integer idx : keys) {
            sb.append("============================================================").append(nl);
            sb.append(translatedChapters.get(idx)).append(nl).append(nl);
        }

        String fullText = sb.toString();
        try {
            java.io.File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
            if (!downloadDir.exists()) downloadDir.mkdirs();
            java.io.File outFile = new java.io.File(downloadDir, currentProjectName + "_FULL_TRANSLATED.txt");
            java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile);
            fos.write(fullText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            fos.flush();
            fos.close();

            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Full Novel", fullText));
            }

            appendLog("📁 Đã lưu file tổng tại: " + outFile.getAbsolutePath());
            Toast.makeText(this, "✅ Đã lưu file thành công tại thư mục Download!" + nl + "Tên file: " + outFile.getName(), Toast.LENGTH_LONG).show();

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, currentProjectName + " - Bản Dịch Hoàn Chỉnh");
            shareIntent.putExtra(Intent.EXTRA_TEXT, fullText.length() > 50000 ? fullText.substring(0, 50000) + nl + nl + "... [Đã lưu toàn bộ file tại thư mục Download]" : fullText);
            startActivity(Intent.createChooser(shareIntent, "Chia sẻ hoặc Mở File Toàn Văn"));
        } catch (Exception e) {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.setPrimaryClip(ClipData.newPlainText("Full Novel", fullText));
            }
            appendLog("📋 Đã sao chép toàn bộ " + translatedChapters.size() + " chương vào Clipboard.");
            Toast.makeText(this, "Đã sao chép toàn văn " + translatedChapters.size() + " chương vào Clipboard!", Toast.LENGTH_LONG).show();
        }
    }

    private TextView createStatusRow(String name, String status) {
        TextView tv = new TextView(this);
        tv.setText("• " + name + ": [" + status + "]");
        tv.setTextColor(Color.parseColor("#34D399"));
        tv.setTypeface(null, Typeface.BOLD);
        tv.setPadding(0, 8, 0, 8);
        return tv;
    }

    private void triggerHaptic() {
        try {
            if (rootFrame != null) {
                rootFrame.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);
            }
        } catch (Exception ignored) {}
    }

    private GradientDrawable createCardDrawable() {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor("#12131A"));
        gd.setCornerRadius(dp(18));
        gd.setStroke(dp(1), Color.parseColor("#1E202E"));
        return gd;
    }

    private android.graphics.drawable.Drawable createButtonDrawable(String hexColor, float radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor(hexColor));
        gd.setCornerRadius(dp(radiusDp));
        gd.setStroke(dp(1), Color.parseColor("#222533"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return new android.graphics.drawable.RippleDrawable(
                    android.content.res.ColorStateList.valueOf(Color.parseColor("#25FFFFFF")),
                    gd, null
            );
        }
        return gd;
    }

    private android.graphics.drawable.Drawable createGradientButtonDrawable(int startColor, int endColor, float radiusDp) {
        GradientDrawable gd = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[]{startColor, endColor});
        gd.setCornerRadius(dp(radiusDp));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            return new android.graphics.drawable.RippleDrawable(
                    android.content.res.ColorStateList.valueOf(Color.parseColor("#35FFFFFF")),
                    gd, null
            );
        }
        return gd;
    }

    private GradientDrawable createInputDrawable() {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor("#0B0C10"));
        gd.setCornerRadius(dp(12));
        gd.setStroke(dp(1), Color.parseColor("#1A1C26"));
        return gd;
    }

    private GradientDrawable createBadgeDrawable(String hexBg, String hexStroke) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor(hexBg));
        gd.setCornerRadius(dp(20));
        if (hexStroke != null) {
            gd.setStroke(dp(1), Color.parseColor(hexStroke));
        }
        return gd;
    }

    private LinearLayout createCard() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(16), dp(14), dp(16), dp(14));
        l.setBackground(createCardDrawable());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(12));
        l.setLayoutParams(lp);
        return l;
    }

    private Button createButton(String text, String colorHex) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(12f);
        b.setTypeface(null, Typeface.BOLD);
        b.setBackground(createButtonDrawable(colorHex, 12f));
        b.setPadding(dp(14), dp(10), dp(14), dp(10));
        b.setMinHeight(dp(40));
        b.setStateListAnimator(null);
        return b;
    }

    private Button createGradientButton(String text, int startColor, int endColor) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(12.5f);
        b.setTypeface(null, Typeface.BOLD);
        b.setBackground(createGradientButtonDrawable(startColor, endColor, 12f));
        b.setPadding(dp(16), dp(11), dp(16), dp(11));
        b.setMinHeight(dp(44));
        b.setStateListAnimator(null);
        return b;
    }

    private EditText createStyledEditText(String hint) {
        EditText edt = new EditText(this);
        edt.setHint(hint);
        edt.setHintTextColor(Color.parseColor("#64748B"));
        edt.setTextColor(Color.WHITE);
        edt.setBackground(createInputDrawable());
        edt.setPadding(dp(12), dp(10), dp(12), dp(10));
        edt.setTextSize(13f);
        edt.setMinHeight(dp(42));
        return edt;
    }
}
