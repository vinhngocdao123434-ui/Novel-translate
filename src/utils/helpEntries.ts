import { HelpInfoItem } from '../components/HelpTooltipModal';

export const HELP_ENTRIES: Record<string, HelpInfoItem> = {
  // ========================================================
  // TAB 1: KEY & PROMPT
  // ========================================================
  'key_pool': {
    title: 'Multi-Key Gemini Pool (Kho Chìa Khóa API)',
    category: 'Quản Lý Khóa API',
    whatIsIt: 'Nơi lưu trữ danh sách API Key Google Gemini của bạn. Ứng dụng sẽ tự động luân phiên đổi chìa khóa khi dịch để không bị nghẽn mạng.',
    howToUse: '• Dán API key (mỗi dòng 1 key) rồi bấm "Thêm API Key Vào Pool".\n• Bấm "Test tất cả key" để kiểm tra độ trễ (latency) và hạn mức còn dùng được.\n• Có thể bật/tắt từng key bằng công tắc.',
    proTip: 'Mẹo hay: Dùng 2 đến 5 tài khoản Google khác nhau để lấy 2 - 5 key nạp vào, giúp dịch liên tục không giới hạn!'
  },
  'test_keys': {
    title: 'Kiểm Tra API Key (Ping & Quota Test)',
    category: 'Quản Lý Khóa API',
    whatIsIt: 'Gửi tín hiệu kiểm tra nhanh đến Google để biết chìa khóa này còn hoạt động tốt và còn hạn ngạch miễn phí hay không.',
    howToUse: 'Bấm nút "Test tất cả key" để kiểm tra đồng loạt.'
  },
  'model_selection': {
    title: 'Lựa Chọn Model Dịch (Mô Hình AI)',
    category: 'Cấu Hình Động Cơ AI',
    whatIsIt: 'Chọn bộ não AI của Google để thực hiện dịch thuật.',
    howToUse: '• Gemini 2.5 Flash-Lite / 3.5 Flash-Lite: Khuyên dùng cho truyện dài (>10MB). Tốc độ siêu nhanh, hạn ngạch dồi dào không lo nghẽn mạng. Hệ thống tự động cứu hộ sẽ vá mượt bản dịch đạt 9/10 điểm.\n• Gemini 2.5 Flash / 3.6 Flash: Dành cho dịch đoạn ngắn cần độ trau chuốt tuyệt đối.',
    proTip: 'Bạn cũng có thể nhập mã Model ID tùy chỉnh của Google vào ô bên dưới rồi bấm "Nạp Model".'
  },
  'prompt_cards': {
    title: 'Thẻ Phong Cách Dịch (Prompt Cards)',
    category: 'Văn Phong Dịch Thuật',
    whatIsIt: 'Quyết định văn phong bản dịch (Tiên hiệp cổ trang, Đô thị hiện đại, Kiếm hiệp kiếm khí...).',
    howToUse: '• Nhấn vào thẻ phong cách để kích hoạt.\n• Bấm "+ Thêm Prompt" để tạo văn phong theo sở thích của riêng bạn.\n• Bấm biểu tượng cây bút để chỉnh sửa nội dung prompt chi tiết.',
    proTip: 'Có thể khôi phục về các thẻ mặc định bất kỳ lúc nào bằng nút "Mặc định".'
  },

  // ========================================================
  // TAB 2: DỊCH & TỪ ĐIỂN
  // ========================================================
  'novel_raw_input': {
    title: 'Mục 1: Nhập & Bóc Tách File Truyện Gốc',
    category: 'Nạp & Phân Tích File',
    whatIsIt: 'Khu vực đưa truyện tiếng Trung thô vào và chia nhỏ thành từng chương để AI xử lý.',
    howToUse: '• Nạp Ebook: Bấm để chọn file .txt, .epub, .mobi, .azw3 từ điện thoại hoặc máy tính. Hệ thống tự giải nén và phân tích cấu trúc.\n• Theo Tác Giả: Tự động dùng biểu thức Regex nhận diện dòng tiêu đề chương (第一章, 第1章, Chương 1, Hồi thứ 1...) để cắt chuẩn y như sách in. Khuyên dùng cho 95% truyện mạng.\n• Tùy Ký Tự (Chunk Size): Cắt đều đặn theo số ký tự (2.000, 3.000, 3.500, 5.000 ký tự). Dùng cho truyện ngắn hoặc file thô bị mất dòng tiêu đề chương.\n• Tách Chương: Bấm nút này sau khi đã dán văn bản hoặc chọn chế độ để hoàn tất chia chương.',
    proTip: 'Độ dài tối ưu nhất cho AI dịch mượt là khoảng 3.000 - 3.500 ký tự mỗi chương.'
  },
  'range_progress': {
    title: 'Mục 2: Tiến Độ Dịch Thuật & Điều Khiển',
    category: 'Tiến Trình Dịch',
    whatIsIt: 'Trung tâm điều khiển toàn bộ quá trình dịch thuật của bộ truyện.',
    howToUse: '• Từ chương -> Đến chương: Nhập khoảng chương bạn muốn dịch hôm nay (ví dụ: từ 1 đến 50).\n• Dịch Range: Khởi động quá trình dịch tự động tuần tự từng chương.\n• Tạm dừng / Tiếp tục: Dừng tạm thời khi có việc bận hoặc để đổi key/model mà không làm mất chương đang dịch.\n• Hủy: Dừng hẳn tiến trình dịch an toàn.\n• ⚡ Dịch Bù Chương Sót: Tự động quét kiểm tra, phát hiện chương nào bị mất mạng/chưa dịch để dịch bù, và TỰ ĐỘNG BỎ QUA 100% các chương đã dịch xong.\n• ✨ Làm Mượt Bản Dịch Final: Khâu quét sạch toàn bộ chữ Hán và từ lai còn sót lại trong toàn tác phẩm sau khi bạn đã dịch xong.',
    proTip: 'Nếu truyện dài, hãy dịch theo từng đợt 50 - 100 chương để dễ kiểm soát và sao lưu.'
  },
  'master_glossary': {
    title: 'Mục 3: Kho Thuật Ngữ Master Glossary',
    category: 'Từ Điển Tác Phẩm',
    whatIsIt: 'Bộ từ điển độc lập của tác phẩm, lưu giữ danh sách tên nhân vật, môn phái, chiêu thức, địa danh (VD: 林辰 = Lâm Thần).',
    howToUse: '• Đảm bảo nhân vật giữ đúng một tên gọi xuyên suốt từ chương đầu đến chương cuối.\n• Thêm nhanh: Nhập "Từ gốc" và "Nghĩa dịch" rồi bấm "+ Thêm Từ".\n• Nạp / Xuất: Nhập hoặc xuất file từ điển dạng .txt (raw=vi) để dùng lại trên máy khác.\n• Mở kho từ điển đầy đủ: Xem toàn bộ danh sách, tra cứu tìm kiếm và chỉnh sửa lại các từ theo ý muốn.',
    proTip: 'Nên kết hợp bật chức năng AI Auto-Learn ở Tab Cài đặt để AI tự động trích xuất nhân vật mới vào kho này.'
  },

  // ========================================================
  // TAB 3: BẢN DỊCH & ĐỌC
  // ========================================================
  'chapter_auditor': {
    title: 'Trình Đọc & Hệ Thống Kiểm Định Chất Lượng',
    category: 'Đọc & Kiểm Tra',
    whatIsIt: 'Không gian đọc bản dịch từng chương kèm hệ thống tự động kiểm tra chất lượng (Chapter Auditor).',
    howToUse: '• Chọn chương cần đọc ở danh sách bên trái.\n• Nhìn huy hiệu góc trên: Xanh lá (100% Tiếng Việt Chuẩn) hoặc Cam (Phát hiện từ cần cứu hộ).\n• Nút "Dịch lại": Yêu cầu AI dịch lại riêng duy nhất chương này nếu chưa ưng ý.\n• Nút "Xuất chương": Tải riêng file .txt của chương đang đọc về máy.'
  },

  // ========================================================
  // TAB 4: CÀI ĐẶT (ĐẦY ĐỦ MỤC 1, 2, 3, 4, 5 & CÁC SUB-TABS)
  // ========================================================
  'settings_api_rotation': {
    title: '1. Cài Đặt Key API & Động Cơ Xoay Tua',
    category: 'Hạ Tầng API & Quản Lý Khóa',
    whatIsIt: 'Quản lý cách thức ứng dụng luân phiên các API Key Gemini và tự động xử lý khi chạm giới hạn hạn mức (Rate Limit 429).',
    howToUse: '• Chiến lược xoay key: "Round-Robin tuần tự" dùng lần lượt từng key một cách đều đặn; "Ưu tiên key khỏe nhất" tự chọn key có phản hồi nhanh nhất.\n• Cooldown 429: Thời gian nghỉ của key khi hết hạn ngạch (khuyên để 60 giây theo chu kỳ của Google).\n• Max Retries: Số lần tự động thử lại với key khác khi gặp lỗi mạng trước khi dừng lại.\n• Độ trễ an toàn: Khoảng nghỉ ngắn giữa 2 chương (1 - 2s) giúp bảo vệ tài khoản không bị hệ thống chặn spam.',
    proTip: 'Cơ chế này phối hợp cùng Multi-Key Pool giúp bạn dịch xuyên suốt không lo đứng máy.'
  },
  'rotation_strategy': {
    title: '1. Cài Đặt Key API & Động Cơ Xoay Tua',
    category: 'Hạ Tầng API & Quản Lý Khóa',
    whatIsIt: 'Quản lý cách thức ứng dụng luân phiên các API Key Gemini và tự động xử lý khi chạm giới hạn hạn mức (Rate Limit 429).',
    howToUse: '• Chiến lược xoay key: "Round-Robin tuần tự" dùng lần lượt từng key một cách đều đặn; "Ưu tiên key khỏe nhất" tự chọn key có phản hồi nhanh nhất.\n• Cooldown 429: Thời gian nghỉ của key khi hết hạn ngạch (khuyên để 60 giây theo chu kỳ của Google).\n• Max Retries: Số lần tự động thử lại với key khác khi gặp lỗi mạng trước khi dừng lại.\n• Độ trễ an toàn: Khoảng nghỉ ngắn giữa 2 chương (1 - 2s) giúp bảo vệ tài khoản không bị hệ thống chặn spam.'
  },
  'cooldown_seconds': {
    title: 'Thời Gian Nghỉ Khi Dính Lỗi 429 (Cooldown)',
    category: 'Tự Động Phục Hồi',
    whatIsIt: 'Khi một chìa khóa dùng hết hạn ngạch trong phút đó, app sẽ tạm cho chìa khóa đó nghỉ ngơi trong số giây này rồi mới dùng lại.',
    howToUse: 'Mặc định là 60 giây (chu kỳ reset hạn ngạch của Google).'
  },

  'settings_glossary_learning': {
    title: '2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning)',
    category: 'Bộ Lọc & Quản Lý Từ Điển',
    whatIsIt: 'Bộ quy chuẩn chất lượng để AI tự động lọc và thu thập tên nhân vật, chiêu thức, địa danh từ bản dịch vào Master Glossary.',
    howToUse: '• Độ dài tối thiểu: Khuyên để từ 2 đến 4 ký tự. Ngăn AI tự ý đưa các từ 1 chữ (như hắn, nàng, đi, đến...) vào từ điển làm rác văn bản.\n• Tần suất tối thiểu: Đặt ≥ 2 lần để chỉ ghi nhớ các nhân vật/địa danh quan trọng xuất hiện lặp lại trong chương.\n• Chính sách xung đột (Conflict Policy): "Giữ cũ - Bỏ mới" (Khuyên dùng) giúp cố định tên nhân vật ban đầu, tránh việc cùng một nhân vật bị đổi tên lộn xộn ở các chương sau.\n• Bộ lọc từ cấm (Blacklist): Danh sách các đại từ hoặc từ thông dụng không bao giờ được phép thêm vào từ điển.',
    proTip: 'Chính sách "Giữ Cũ - Bỏ Mới" là chìa khóa vàng giúp toàn bộ 1000 chương truyện thống nhất tên gọi.'
  },
  'quality_filters': {
    title: '2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning)',
    category: 'Bộ Lọc & Quản Lý Từ Điển',
    whatIsIt: 'Bộ quy chuẩn chất lượng để AI tự động lọc và thu thập tên nhân vật, chiêu thức, địa danh từ bản dịch vào Master Glossary.',
    howToUse: '• Độ dài tối thiểu: Khuyên để từ 2 đến 4 ký tự. Ngăn AI tự ý đưa các từ 1 chữ (như hắn, nàng, đi, đến...) vào từ điển làm rác văn bản.\n• Tần suất tối thiểu: Đặt ≥ 2 lần để chỉ ghi nhớ các nhân vật/địa danh quan trọng xuất hiện lặp lại trong chương.\n• Chính sách xung đột (Conflict Policy): "Giữ cũ - Bỏ mới" (Khuyên dùng) giúp cố định tên nhân vật ban đầu, tránh việc cùng một nhân vật bị đổi tên lộn xộn ở các chương sau.\n• Bộ lọc từ cấm (Blacklist): Danh sách các đại từ hoặc từ thông dụng không bao giờ được phép thêm vào từ điển.'
  },
  'min_term_length': {
    title: '2. Tinh Chỉnh Thuật Ngữ Glossary (AI Auto-Learning)',
    category: 'Bộ Lọc & Quản Lý Từ Điển',
    whatIsIt: 'Bộ quy chuẩn chất lượng để AI tự động lọc và thu thập tên nhân vật, chiêu thức, địa danh từ bản dịch vào Master Glossary.',
    howToUse: '• Độ dài tối thiểu: Khuyên để từ 2 đến 4 ký tự. Ngăn AI tự ý đưa các từ 1 chữ (như hắn, nàng, đi, đến...) vào từ điển làm rác văn bản.\n• Tần suất tối thiểu: Đặt ≥ 2 lần để chỉ ghi nhớ các nhân vật/địa danh quan trọng xuất hiện lặp lại trong chương.\n• Chính sách xung đột (Conflict Policy): "Giữ cũ - Bỏ mới" (Khuyên dùng) giúp cố định tên nhân vật ban đầu, tránh việc cùng một nhân vật bị đổi tên lộn xộn ở các chương sau.\n• Bộ lọc từ cấm (Blacklist): Danh sách các đại từ hoặc từ thông dụng không bao giờ được phép thêm vào từ điển.'
  },

  'settings_translation_anti_hanzi': {
    title: '3. Cài Đặt Dịch Thuật & Chống Lọt Chữ Hán',
    category: 'Chất Lượng Bản Dịch & Đa Ngôn Ngữ',
    whatIsIt: 'Kiểm soát ngôn ngữ dịch đầu ra và hệ thống phòng thủ chống sót chữ Hán 2 lớp (Dual-Layer Guard).',
    howToUse: '• Ngôn ngữ đích: Chọn Tiếng Việt, Tiếng Nhật, Tiếng Anh hoặc Tiếng Hàn.\n• Bộ lọc chống lọt chữ Hán 2 lớp:\n  - Lớp 1 (Ép khuôn Prompt): Cấm AI sinh chữ tượng hình Hán trong câu trả lời.\n  - Lớp 2 (Hậu kiểm Regex): Tự động quét regex [\\u4e00-\\u9fa5] để chuyển đổi triệt để sang âm Hán-Việt chuẩn, bản dịch sạch 100% tiếng Việt!\n• Ngữ cảnh nối chương: Kẹp 250 - 350 ký tự đoạn cuối của chương trước vào đầu chương sau để AI bắt nhịp văn phong và cách xưng hô liền mạch.',
    proTip: 'Nếu chọn ngôn ngữ đích là Tiếng Nhật, app sẽ tự động thả lỏng để AI sinh chữ Kanji tự nhiên.'
  },
  'output_guard': {
    title: '3. Cài Đặt Dịch Thuật & Chống Lọt Chữ Hán',
    category: 'Chất Lượng Bản Dịch & Đa Ngôn Ngữ',
    whatIsIt: 'Kiểm soát ngôn ngữ dịch đầu ra và hệ thống phòng thủ chống sót chữ Hán 2 lớp (Dual-Layer Guard).',
    howToUse: '• Ngôn ngữ đích: Chọn Tiếng Việt, Tiếng Nhật, Tiếng Anh hoặc Tiếng Hàn.\n• Bộ lọc chống lọt chữ Hán 2 lớp:\n  - Lớp 1 (Ép khuôn Prompt): Cấm AI sinh chữ tượng hình Hán trong câu trả lời.\n  - Lớp 2 (Hậu kiểm Regex): Tự động quét regex [\\u4e00-\\u9fa5] để chuyển đổi triệt để sang âm Hán-Việt chuẩn, bản dịch sạch 100% tiếng Việt!\n• Ngữ cảnh nối chương: Kẹp 250 - 350 ký tự đoạn cuối của chương trước vào đầu chương sau để AI bắt nhịp văn phong và cách xưng hô liền mạch.'
  },

  'settings_reader_experience': {
    title: '4. Cài Đặt Trình Đọc & Trải Nghiệm Đọc',
    category: 'Giao Diện & Đọc Truyện',
    whatIsIt: 'Tùy biến cỡ chữ hiển thị và hành vi màn hình thiết bị khi bạn đọc truyện trực tiếp trên ứng dụng.',
    howToUse: '• Cỡ chữ mặc định: Tùy chọn từ 14 đến 22 để phù hợp với kích thước màn hình và tầm mắt của bạn.\n• Giữ sáng màn hình khi đọc: Kích hoạt cờ hệ thống FLAG_KEEP_SCREEN_ON giúp màn hình không bao giờ bị tối hoặc tự khóa trong lúc bạn đang đọc một chương truyện dài.',
    proTip: 'Cài đặt này sẽ được lưu cố định cho các lần mở app sau.'
  },

  'settings_god_mode': {
    title: '5. Kiểm Soát 5 Lớp Chạy Ngầm (God-Mode)',
    category: 'Độ Bền Bỉ Hệ Thống Android',
    whatIsIt: 'Kiến trúc dịch ngầm độc quyền giúp ứng dụng dịch liên tục hàng nghìn chương ngay cả khi tắt màn hình, khóa máy hoặc máy ít RAM.',
    howToUse: '• Lớp 1 (Foreground Service): Hiển thị tiến trình dịch liên tục trên thanh thông báo hệ thống.\n• Lớp 2 (CPU WakeLock): Giữ chip xử lý chạy ngầm, chống Deep Sleep khi tắt màn hình.\n• Lớp 3 (Bỏ qua tối ưu pin Doze Mode): Miễn nhiễm với cơ chế tự ngắt ứng dụng của Android.\n• Lớp 4 (WorkManager Watchdog): Tự động kiểm tra và hồi sinh tiến trình sau 15 giây nếu bị Android vô tình giải phóng RAM.\n• Lớp 5 (Root OOM Score -1000): Thiết lập độ ưu tiên tối thượng tương đương tiến trình nhân hệ thống (dành cho máy Root).',
    proTip: 'Bạn hoàn toàn có thể cắm sạc, khóa màn hình và đi ngủ, sáng dậy sẽ có hàng trăm chương truyện đã dịch xong!'
  },
  'foreground_service': {
    title: '5. Kiểm Soát 5 Lớp Chạy Ngầm (God-Mode)',
    category: 'Độ Bền Bỉ Hệ Thống Android',
    whatIsIt: 'Kiến trúc dịch ngầm độc quyền giúp ứng dụng dịch liên tục hàng nghìn chương ngay cả khi tắt màn hình, khóa máy hoặc máy ít RAM.',
    howToUse: '• Lớp 1 (Foreground Service): Hiển thị tiến trình dịch liên tục trên thanh thông báo hệ thống.\n• Lớp 2 (CPU WakeLock): Giữ chip xử lý chạy ngầm, chống Deep Sleep khi tắt màn hình.\n• Lớp 3 (Bỏ qua tối ưu pin Doze Mode): Miễn nhiễm với cơ chế tự ngắt ứng dụng của Android.\n• Lớp 4 (WorkManager Watchdog): Tự động kiểm tra và hồi sinh tiến trình sau 15 giây nếu bị Android vô tình giải phóng RAM.\n• Lớp 5 (Root OOM Score -1000): Thiết lập độ ưu tiên tối thượng tương đương tiến trình nhân hệ thống (dành cho máy Root).'
  },

  'settings_projects_manager': {
    title: 'Quản Lý & Lưu Trữ Đa Dự Án Truyện',
    category: 'Quản Lý Tác Phẩm',
    whatIsIt: 'Quản lý nhiều bộ truyện độc lập cùng lúc trên một thiết bị mà không bị lẫn lộn dữ liệu.',
    howToUse: '• Mỗi dự án lưu giữ riêng biệt: toàn bộ các chương thô, bản dịch đã hoàn thành và từ điển Master Glossary riêng của bộ đó.\n• Bấm nút "Chuyển sang" để tiếp tục dịch hoặc đọc một bộ truyện khác.\n• Bấm "Tạo Mới" để bắt đầu một bộ truyện mới.\n• Nút "Xóa vĩnh viễn dự án": Chỉ xóa nội dung của bộ truyện đang chọn. Kho Key API và các Thẻ Prompt ở Tab 1 được bảo toàn vĩnh cửu 100%!',
    proTip: 'Bạn có thể lưu trữ hàng chục bộ truyện cùng lúc mà không lo mất dữ liệu.'
  },

  'export_full_txt': {
    title: 'Xuất Toàn Văn Tác Phẩm (.txt / .epub)',
    category: 'Xuất Dữ Liệu Hoàn Tất',
    whatIsIt: 'Gộp toàn bộ tất cả các chương đã dịch thành một file văn bản hoàn chỉnh (.txt) duy nhất.',
    howToUse: 'Bấm nút "📥 Xuất Toàn Văn (.txt)" để lưu truyện về máy. File sau khi tải có thể nạp vào máy đọc sách Kindle, Kobo hoặc các ứng dụng đọc truyện trên điện thoại.'
  }
};
