package com.example.customerservice.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

final class LicenseKeyGenerator {

    private LicenseKeyGenerator() {
    }

    static String generate() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        StringBuilder builder = new StringBuilder("PX");
        for (int i = 0; i < timestamp.length(); i++) {
            int position = i + 1;
            int digit = Character.digit(timestamp.charAt(i), 10);
            boolean shouldConvert = (position % 2 == 0 && digit % 2 == 0)
                    || (position % 2 == 1 && digit % 2 == 1);
            if (shouldConvert) {
                builder.append((char) ('A' + digit));
            } else {
                builder.append(digit);
            }
        }
        return builder.toString();
    }
}
