package com.droidtranslator.app;

import java.util.HashMap;
import java.util.Map;

/**
 * Bảng tra cứu âm Hán-Việt cứu hộ tự động (Sino-Vietnamese Transliteration Engine)
 * Chuyển đổi toàn bộ chữ Hán còn sót lại thành âm Hán-Việt chuẩn
 */
public class SinoVietnameseDictionary {

    private static final Map<Character, String> SINO_MAP = new HashMap<>();

    static {
        String[][] pairs = {
            {"陈", "Trần"}, {"硕", "Thạc"}, {"林", "Lâm"}, {"辰", "Thần"},
            {"张", "Trương"}, {"李", "Lý"}, {"王", "Vương"}, {"刘", "Lưu"},
            {"杨", "Dương"}, {"黄", "Hoàng"}, {"赵", "Triệu"}, {"吴", "Ngô"},
            {"周", "Chu"}, {"徐", "Từ"}, {"孙", "Tôn"}, {"马", "Mã"},
            {"朱", "Chu"}, {"胡", "Hồ"}, {"郭", "Quách"}, {"何", "Hà"},
            {"高", "Cao"}, {"罗", "La"}, {"郑", "Trịnh"}, {"梁", "Lương"},
            {"谢", "Tạ"}, {"宋", "Tống"}, {"唐", "Đường"}, {"许", "Hứa"},
            {"韩", "Hàn"}, {"冯", "Phùng"}, {"邓", "Đặng"}, {"曹", "Tào"},
            {"彭", "Bành"}, {"曾", "Tăng"}, {"萧", "Tiêu"}, {"田", "Điền"},
            {"董", "Đổng"}, {"潘", "Phan"}, {"袁", "Viên"}, {"蔡", "Thái"},
            {"蒋", "Tưởng"}, {"余", "Dư"}, {"于", "Vu"}, {"杜", "Đỗ"},
            {"剑", "Kiếm"}, {"刀", "Đao"}, {"宗", "Tông"}, {"门", "Môn"},
            {"峰", "Phong"}, {"山", "Sơn"}, {"海", "Hải"}, {"天", "Thiên"},
            {"地", "Địa"}, {"玄", "Huyền"}, {"黄", "Hoàng"}, {"宇", "Vũ"},
            {"宙", "Trụ"}, {"洪", "Hồng"}, {"荒", "Hoang"}, {"神", "Thần"},
            {"仙", "Tiên"}, {"魔", "Ma"}, {"妖", "Yêu"}, {"鬼", "Quỷ"},
            {"圣", "Thánh"}, {"皇", "Hoàng"}, {"帝", "Đế"}, {"尊", "Tôn"},
            {"丹", "Đan"}, {"阵", "Trận"}, {"符", "Phù"}, {"器", "Khí"},
            {"鼎", "Đỉnh"}, {"塔", "Tháp"}, {"殿", "Điện"}, {"阁", "Các"},
            {"城", "Thành"}, {"国", "Quốc"}, {"界", "Giới"}, {"域", "Vực"}
        };
        for (String[] p : pairs) {
            if (p[0].length() > 0) {
                SINO_MAP.put(p[0].charAt(0), p[1]);
            }
        }
    }

    public static String transliterateLeftoverHanzi(String text) {
        if (text == null || text.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c >= 0x4E00 && c <= 0x9FA5) {
                String vi = SINO_MAP.get(c);
                if (vi != null) {
                    sb.append(vi);
                } else {
                    sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
