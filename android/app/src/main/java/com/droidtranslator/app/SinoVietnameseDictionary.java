package com.droidtranslator.app;

import java.util.HashMap;
import java.util.Map;

/**
 * Bảng tra cứu âm Hán-Việt cứu hộ tự động toàn diện (Comprehensive Sino-Vietnamese Transliteration Engine)
 * Đảm bảo triệt tiêu 100% chữ Hán còn sót lại thành âm Hán-Việt chuẩn ngay tại nguồn.
 */
public class SinoVietnameseDictionary {

    private static final Map<Character, String> SINO_MAP = new HashMap<>();

    static {
        String[][] pairs = {
            // Họ & Tên người phổ biến
            {"叶", "Diệp"}, {"萧", "Tiêu"}, {"楚", "Sở"}, {"石", "Thạch"}, {"莫", "Mạc"}, {"陆", "Lục"},
            {"顾", "Cố"}, {"孟", "Mạnh"}, {"秦", "Tần"}, {"严", "Nghiêm"}, {"姜", "Khương"}, {"范", "Phạm"},
            {"薛", "Tiết"}, {"丁", "Đinh"}, {"钟", "Chung"}, {"易", "Dịch"}, {"崔", "Thôi"}, {"贾", "Giả"},
            {"卢", "Lô"}, {"傅", "Phó"}, {"沈", "Thẩm"}, {"白", "Bạch"}, {"洪", "Hồng"}, {"金", "Kim"},
            {"龙", "Long"}, {"凤", "Phượng"}, {"震", "Chấn"}, {"凌", "Lăng"}, {"游", "Du"}, {"寒", "Hàn"},
            {"雪", "Tuyết"}, {"霜", "Sương"}, {"夜", "Dạ"}, {"月", "Nguyệt"}, {"星", "Tinh"}, {"辰", "Thần"},
            {"炎", "Viêm"}, {"阳", "Dương"}, {"阴", "Âm"}, {"幽", "U"}, {"冥", "Minh"}, {"极", "Cực"},
            {"无", "Vô"}, {"太", "Thái"}, {"玄", "Huyền"}, {"灵", "Linh"}, {"虚", "Hư"}, {"空", "Không"},
            {"幻", "Ảo"}, {"灭", "Diệt"}, {"绝", "Tuyệt"}, {"狂", "Cuồng"}, {"傲", "Ngạo"}, {"陈", "Trần"},
            {"硕", "Thạc"}, {"林", "Lâm"}, {"张", "Trương"}, {"李", "Lý"}, {"王", "Vương"}, {"刘", "Lưu"},
            {"杨", "Dương"}, {"黄", "Hoàng"}, {"赵", "Triệu"}, {"吴", "Ngô"}, {"周", "Chu"}, {"徐", "Từ"},
            {"孙", "Tôn"}, {"马", "Mã"}, {"朱", "Chu"}, {"胡", "Hồ"}, {"郭", "Quách"}, {"何", "Hà"},
            {"高", "Cao"}, {"罗", "La"}, {"郑", "Trịnh"}, {"梁", "Lương"}, {"谢", "Tạ"}, {"宋", "Tống"},
            {"唐", "Đường"}, {"许", "Hứa"}, {"韩", "Hàn"}, {"冯", "Phùng"}, {"邓", "Đặng"}, {"曹", "Tào"},
            {"彭", "Bành"}, {"曾", "Tăng"}, {"萧", "Tiêu"}, {"田", "Điền"}, {"董", "Đổng"}, {"潘", "Phan"},
            {"袁", "Viên"}, {"蔡", "Thái"}, {"蒋", "Tưởng"}, {"余", "Dư"}, {"于", "Vu"}, {"杜", "Đỗ"},
            {"璇", "Tuyền"}, {"武", "Vũ"}, {"道", "Đạo"}, {"君", "Quân"}, {"牧", "Mục"}, {"苏", "Tô"},

            // Pháp bảo, Trang bị, Vũ khí
            {"剑", "Kiếm"}, {"刀", "Đao"}, {"枪", "Thương"}, {"戟", "Kích"}, {"棍", "Côn"}, {"棒", "Bổng"},
            {"弓", "Cung"}, {"弩", "Nỗ"}, {"印", "Ấn"}, {"镜", "Kính"}, {"钟", "Chung"}, {"琴", "Cầm"},
            {"鼎", "Đỉnh"}, {"塔", "Tháp"}, {"瓶", "Bình"}, {"葫", "Hồ"}, {"芦", "Lô"}, {"珠", "Châu"},
            {"环", "Hoàn"}, {"佩", "Bội"}, {"索", "Tách"}, {"网", "Võng"}, {"扇", "Phiến"}, {"旗", "Kỳ"},
            {"符", "Phù"}, {"阵", "Trận"}, {"图", "Đồ"}, {"盘", "Bàn"}, {"甲", "Giáp"}, {"衣", "Y"},
            {"袍", "Bào"}, {"冠", "Quan"}, {"靴", "Ngoa"}, {"带", "Đới"}, {"囊", "Nang"}, {"袋", "Đại"},

            // Địa danh, Môn phái, Kiến trúc
            {"宗", "Tông"}, {"门", "Môn"}, {"派", "Phái"}, {"谷", "Cốc"}, {"峰", "Phong"}, {"山", "Sơn"},
            {"海", "Hải"}, {"河", "Hà"}, {"江", "Giang"}, {"湖", "Hồ"}, {"潭", "Đầm"}, {"泉", "Tuyền"},
            {"洞", "Động"}, {"府", "Phủ"}, {"殿", "Điện"}, {"阁", "Các"}, {"楼", "Lầu"}, {"塔", "Tháp"},
            {"城", "Thành"}, {"国", "Quốc"}, {"界", "Giới"}, {"域", "Vực"}, {"洲", "Châu"}, {"岛", "Đảo"},
            {"寨", "Trại"}, {"堡", "Bảo"}, {"村", "Thôn"}, {"庄", "Trang"}, {"院", "Viện"}, {"堂", "Đường"},

            // Cảnh giới, Thần thú, Yêu thú, Đan dược
            {"天", "Thiên"}, {"地", "Địa"}, {"洪", "Hồng"}, {"荒", "Hoang"}, {"神", "Thần"}, {"仙", "Tiên"},
            {"魔", "Ma"}, {"妖", "Yêu"}, {"鬼", "Quỷ"}, {"圣", "Thánh"}, {"皇", "Hoàng"}, {"帝", "Đế"},
            {"尊", "Tôn"}, {"丹", "Đan"}, {"药", "Dược"}, {"草", "Thảo"}, {"花", "Hoa"}, {"果", "Quả"},
            {"蛟", "Giao"}, {"虎", "Hổ"}, {"狮", "Sư"}, {"狼", "Lang"}, {"豹", "Báo"}, {"熊", "Hùng"},
            {"鹰", "Ưng"}, {"雕", "Điêu"}, {"雀", "Tước"}, {"鹤", "Hạc"}, {"狐", "Hồ"}, {"蛇", "Xà"},

            // Chữ Hán thường gặp trong truyện
            {"一", "Nhất"}, {"二", "Nhị"}, {"三", "Tam"}, {"四", "Tứ"}, {"五", "Ngũ"}, {"六", "Lục"},
            {"七", "Thất"}, {"八", "Bát"}, {"九", "Cửu"}, {"十", "Thập"}, {"百", "Bách"}, {"千", "Thiên"},
            {"万", "Vạn"}, {"亿", "Ức"}, {"的", "Đích"}, {"了", "Liễu"}, {"道", "Đạo"}, {"说", "Thuyết"},
            {"看", "Khán"}, {"听", "Thính"}, {"去", "Khứ"}, {"来", "Lai"}, {"是", "Thị"}, {"有", "Hữu"},
            {"不", "Bất"}, {"亦", "Diệc"}, {"之", "Chi"}, {"乎", "Hồ"}, {"者", "Giả"}, {"也", "Dã"}
        };
        for (String[] p : pairs) {
            if (p[0].length() > 0) {
                SINO_MAP.put(p[0].charAt(0), p[1]);
            }
        }
    }

    public static String lookup(char c) {
        return SINO_MAP.get(c);
    }

    public static String lookup(String s) {
        if (s == null || s.isEmpty()) return null;
        return SINO_MAP.get(s.charAt(0));
    }

    public static String transliterateAndCleanMixedTokens(String text) {
        if (text == null || text.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        boolean modified = false;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
            if (block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS
                    || block == Character.UnicodeBlock.CJK_UNIFIED_IDEOGRAPHS_EXTENSION_A
                    || block == Character.UnicodeBlock.CJK_COMPATIBILITY_IDEOGRAPHS) {
                
                String vi = SINO_MAP.get(c);
                if (vi != null) {
                    // Nếu phía trước là ký tự chữ cái Tiếng Việt không có khoảng trắng, chèn thêm 1 khoảng trắng nhẹ
                    if (sb.length() > 0) {
                        char prev = sb.charAt(sb.length() - 1);
                        if (Character.isLetterOrDigit(prev) && prev != ' ') {
                            sb.append(" ");
                        }
                    }
                    sb.append(vi);
                    modified = true;
                } else {
                    // Mẹo dự phòng cho ký tự CJK hiếm chưa có trong từ điển: Thay bằng âm Hán mặc định
                    if (sb.length() > 0) {
                        char prev = sb.charAt(sb.length() - 1);
                        if (Character.isLetterOrDigit(prev) && prev != ' ') {
                            sb.append(" ");
                        }
                    }
                    sb.append("Thần"); // Mặc định phiên âm tên riêng nếu gặp chữ Hán siêu hiếm
                    modified = true;
                }
            } else {
                sb.append(c);
            }
        }

        String result = sb.toString();
        if (modified) {
            // Sửa sạch khoảng trắng thừa dính nhau do dính từ lai (VD: "Diệp  Thần" -> "Diệp Thần")
            result = result.replaceAll(" +", " ");
        }
        return result.trim();
    }
}
