import { HelpInfoItem } from '../components/HelpTooltipModal';

export const HELP_ENTRIES: Record<string, HelpInfoItem> = {
  // ========================================================
  // TAB 1: KEY & PROMPT
  // ========================================================
  'select_model': {
    title: 'Chọn Dòng Model Gemini',
    category: 'Bộ Não AI',
    whatIsIt: 'Chọn phiên bản trí tuệ nhân tạo của Google để dịch truyện.',
    howToUse: '• 2.5 Flash / 3.5 Flash Lite / 2.5 Flash Lite: Dịch siêu tốc, tốn rất ít hạn mức, thích hợp dịch truyện dài hàng nghìn chương.\n• 3.6 Flash / 2.5 Pro: Câu từ mượt mà, văn phong chau chuốt nhất.',
    proTip: 'Nên chọn "2.5 Flash" hoặc "3.5 Flash Lite" làm mặc định để dịch nhanh và không lo hết lượt.'
  },
  'model_selection': {
    title: 'Chọn Dòng Model Gemini',
    category: 'Bộ Não AI',
    whatIsIt: 'Chọn phiên bản trí tuệ nhân tạo của Google để dịch truyện.',
    howToUse: '• 2.5 Flash / 3.5 Flash Lite / 2.5 Flash Lite: Dịch siêu tốc, tốn rất ít hạn mức, thích hợp dịch truyện dài hàng nghìn chương.\n• 3.6 Flash / 2.5 Pro: Câu từ mượt mà, văn phong chau chuốt nhất.',
    proTip: 'Nên chọn "2.5 Flash" hoặc "3.5 Flash Lite" làm mặc định để dịch nhanh và không lo hết lượt.'
  },
  'key_pool': {
    title: 'Kho Chìa Khóa API (Key Pool)',
    category: 'Quản Lý API Key',
    whatIsIt: 'Nơi chứa các mã API Key miễn phí từ Google để chạy dịch.',
    howToUse: '• Dán nhiều key (mỗi dòng 1 key) rồi bấm "+ Thêm API Key Vào Pool".\n• App sẽ tự động đổi sang key khác khi key hiện tại bị nghẽn mạng.',
    proTip: 'Nên nạp từ 2 đến 5 key của các tài khoản Google khác nhau để dịch liên tục không bao giờ bị dừng.'
  },
  'test_keys': {
    title: 'Kiểm Tra API Key',
    category: 'Quản Lý API Key',
    whatIsIt: 'Gửi tín hiệu kiểm tra nhanh xem key còn dùng được hay không.',
    howToUse: 'Bấm nút "Test tất cả key" để kiểm tra đồng loạt.'
  },
  'prompt_cards': {
    title: 'Thẻ Phong Cách Dịch',
    category: 'Văn Phong',
    whatIsIt: 'Hướng dẫn AI dịch theo thể loại truyện bạn thích (Tiên hiệp, Đô thị, Kiếm hiệp...).',
    howToUse: '• Chọn thẻ có sẵn hoặc bấm "+ Thêm" để tự viết phong cách riêng.',
    proTip: 'Mặc định phong cách Tiên Hiệp đã được tối ưu rất mượt cho hầu hết truyện dịch.'
  },

  // ========================================================
  // TAB 2: DỊCH & TỪ ĐIỂN
  // ========================================================
  'novel_raw_input': {
    title: 'Nạp File Truyện Gốc',
    category: 'Nạp File',
    whatIsIt: 'Tải file tiếng Trung (.txt hoặc .epub) vào để máy tự động cắt chương.',
    howToUse: '• Chọn "Tách Tác Giả (Regex)" để app tự nhận diện tiêu đề từng chương y như sách in.',
    proTip: 'Nên dùng file .txt chuẩn để app chia chương chính xác nhất.'
  },
  'range_progress': {
    title: 'Tiến Độ Dịch Thuật',
    category: 'Quá Trình Dịch',
    whatIsIt: 'Khu vực điều khiển AI dịch từ chương nào đến chương nào.',
    howToUse: '• Nhập số chương cần dịch (VD: 1 đến 50) rồi bấm "▶ Dịch Range".\n• "⚡ Dịch Bù Chương Sót": Tự động tìm và dịch nốt các chương bị thiếu/lỗi mà không dịch lại các chương đã có.',
    proTip: 'Nếu bị đứt mạng giữa chừng, chỉ cần bấm "Dịch Bù Chương Sót" là xong ngay.'
  },
  'master_glossary': {
    title: 'Kho Từ Điển (Glossary)',
    category: 'Từ Điển Nhân Vật',
    whatIsIt: 'Danh sách tên nhân vật, môn phái và địa danh để dịch đồng nhất.',
    howToUse: '• Ví dụ: 林辰 ➔ Lâm Thần. Đảm bảo nhân vật giữ đúng một tên từ đầu đến cuối truyện.',
    proTip: 'Bạn có thể thêm từ thủ công hoặc để app tự động thu thập trong quá trình dịch.'
  },

  // ========================================================
  // TAB 3: BẢN DỊCH & ĐỌC
  // ========================================================
  'chapter_auditor': {
    title: 'Đọc & Xem Bản Dịch',
    category: 'Trình Đọc',
    whatIsIt: 'Nơi đọc truyện toàn màn hình với giao diện tối chống mỏi mắt.',
    howToUse: '• Chạm vào chương để mở trình đọc.\n• Hỗ trợ xem Bản Dịch hoặc xem Song Ngữ (đối chiếu Trung - Việt).',
    proTip: 'Bấm vào nút "Dịch lại" trong từng chương nếu muốn AI làm lại riêng chương đó.'
  },

  // ========================================================
  // TAB 4: CÀI ĐẶT
  // ========================================================
  'settings_projects_manager': {
    title: 'Quản Lý Dự Án Truyện',
    category: 'Quản Lý Dự Án',
    whatIsIt: 'Giúp bạn dịch cùng lúc nhiều bộ truyện khác nhau mà không bị lẫn lộn.',
    howToUse: '• Bấm "Chuyển Dự Án" để đổi sang truyện khác.\n• Bấm "+ Tạo Mới" để bắt đầu một bộ truyện mới.\n• Xóa dự án chỉ xóa nội dung truyện đó, kho Key API và Thẻ Prompt được giữ nguyên 100%.',
    proTip: 'Mỗi truyện sẽ có một kho từ điển và danh sách chương riêng biệt.'
  },
  'settings_glossary_learning': {
    title: 'Tự Động Gom Từ Điển (AI Auto-Learning)',
    category: 'Bộ Lọc Từ Điển',
    whatIsIt: 'Máy sẽ tự động phát hiện tên nhân vật mới trong truyện và lưu vào từ điển.',
    howToUse: '• Độ dài chữ Hán tối thiểu: Nên để 2 hoặc 3 ký tự (tránh lưu chữ rác 1 từ).\n• Tần suất lặp lại: Nên để 2 đến 4 lần (để chỉ lưu các nhân vật quan trọng).',
    proTip: 'Bật tính năng này giúp bạn không cần phải tự gõ từ điển bằng tay.'
  },
  'settings_min_term_length': {
    title: 'Độ Dài Chữ Hán Tối Thiểu',
    category: 'Lọc Từ Điển',
    whatIsIt: 'Quy định từ tiếng Trung phải có từ bao nhiêu chữ trở lên thì mới được lưu vào từ điển.',
    howToUse: '• KHUYÊN DÙNG: Đặt là 2 hoặc 3 ký tự.\n• TẠI SAO: Nếu đặt 1 ký tự, máy sẽ lưu cả những chữ thông thường như "tôi", "nó", "đi" làm hỏng bản dịch.',
    proTip: 'Nên để mặc định là 2 ký tự.'
  },
  'settings_min_frequency': {
    title: 'Tần Suất Lặp Lại Tối Thiểu',
    category: 'Lọc Từ Điển',
    whatIsIt: 'Từ tiếng Trung đó phải xuất hiện bao nhiêu lần trong chương thì mới được coi là tên nhân vật.',
    howToUse: '• KHUYÊN DÙNG: Đặt từ 2 đến 4 lần.\n• TẠI SAO: Tránh lưu những từ người qua đường chỉ xuất hiện 1 lần rồi biến mất.',
    proTip: 'Nên để mặc định là 2 hoặc 3 lần.'
  },
  'settings_conflict_policy': {
    title: 'Xử Lý Khi Trùng Tên Nhân Vật (Xung Đột Nghĩa)',
    category: 'Quy Tắc Tên',
    whatIsIt: 'Khi chương sau xuất hiện một từ đã có ở chương trước nhưng nghĩa dịch hơi khác nhau.',
    howToUse: '• KHUYÊN DÙNG: Chọn "Giữ Cũ - Bỏ Mới".\n• TẠI SAO: Để tên nhân vật từ chương 1 không bao giờ bị đổi sang tên khác ở chương 100.',
    proTip: 'Luôn chọn "Giữ Cũ" để tên nhân vật xuyên suốt và đồng nhất.'
  },
  'settings_translation_anti_hanzi': {
    title: 'Chống Lọt Chữ Hán (2 Lớp)',
    category: 'Lọc Chữ Sót',
    whatIsIt: 'Tự động rà soát và chuyển sạch toàn bộ chữ tiếng Trung còn sót lại sang tiếng Việt.',
    howToUse: '• KHUYÊN DÙNG: NÊN BẬT (Nút gạt xanh ngọc).\n• TÁC DỤNG: Đảm bảo bản dịch 100% tiếng Việt, không bị lẫn chữ tượng hình.',
    proTip: 'Hãy luôn BẬT tính năng này để có trải nghiệm đọc truyện hoàn hảo.'
  },
  'settings_anti_hanzi': {
    title: 'Bộ Lọc Chống Lọt Chữ Hán',
    category: 'Lọc Chữ Sót',
    whatIsIt: 'Rà soát và chuyển sạch toàn bộ chữ Hán sót sang tiếng Việt.',
    howToUse: 'Gạt nút sang BẬT (Màu xanh ngọc) để kích hoạt bảo vệ 2 lớp.',
    proTip: 'Khuyên dùng luôn BẬT cho truyện dịch tiếng Việt.'
  },
  'settings_auto_heal': {
    title: 'Tự Động Sửa Lỗi Khi Mất Mạng (Auto-Heal)',
    category: 'Tự Động Cứu Hộ',
    whatIsIt: 'Nếu đang dịch mà bị rớt mạng hoặc AI trả về thiếu câu, app sẽ tự đổi chìa khóa (Key) khác để dịch lại ngay.',
    howToUse: '• KHUYÊN DÙNG: NÊN BẬT (Nút gạt xanh ngọc).\n• TÁC DỤNG: Bạn không cần phải ngồi canh máy bấm dịch lại từng câu.',
    proTip: 'BẬT tính năng này giúp bạn có thể cắm máy dịch tự động cả đêm.'
  },
  'settings_target_language': {
    title: 'Ngôn Ngữ Đích',
    category: 'Ngôn Ngữ',
    whatIsIt: 'Chọn ngôn ngữ bạn muốn dịch sang (Tiếng Việt, Tiếng Nhật, Tiếng Anh, Tiếng Hàn).',
    howToUse: '• Mặc định là Tiếng Việt.\n• Nếu chọn Tiếng Nhật, app sẽ cho phép sinh chữ Kanji mượt mà.',
    proTip: 'Chọn Tiếng Việt để đọc truyện dịch tốt nhất.'
  },
  'settings_god_mode': {
    title: 'Dịch Ngầm Chống Tắt Máy (God-Mode)',
    category: 'Chạy Ngầm',
    whatIsIt: 'Hệ thống giúp máy tiếp tục dịch ngay cả khi bạn tắt màn hình, khóa máy hoặc chuyển sang ứng dụng khác.',
    howToUse: '• Hoàn toàn tự động kích hoạt.\n• Không lo bị Android tự tắt app khi thiếu RAM.',
    proTip: 'Bạn có thể khóa máy đi ngủ, sáng dậy truyện đã dịch xong.'
  },
  'settings_api_rotation': {
    title: 'Thời Gian Nghỉ Giữa Các Chương',
    category: 'Tốc Độ Dịch',
    whatIsIt: 'Khoảng thời gian nghỉ ngắn (1 - 3 giây) giữa các chương để tránh bị Google chặn mạng vì gửi lệnh quá nhanh.',
    howToUse: '• Khuyên để từ 1 đến 2 giây là tối ưu nhất.',
    proTip: 'Để 2 giây giúp bảo vệ API Key sống lâu và ổn định.'
  },
  'export_full_txt': {
    title: 'Xuất Toàn Văn Truyện (.txt)',
    category: 'Lưu File',
    whatIsIt: 'Gộp tất cả các chương đã dịch thành 1 file .txt duy nhất lưu vào máy.',
    howToUse: '• File lưu trong thư mục Download của điện thoại.\n• Đọc mượt trên mọi máy đọc sách Kindle, Kobo hoặc app đọc truyện.',
    proTip: 'File xuất ra định dạng chuẩn, không bao giờ bị lỗi font.'
  }
};
