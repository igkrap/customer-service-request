package com.example.customerservice.mapper;

import com.example.customerservice.model.EmailSettings;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface EmailSettingsMapper {
    void insertEmailSettings(EmailSettings emailSettings);
    EmailSettings getEmailSettingsById(Long id);
    EmailSettings getActiveEmailSettings();
    List<EmailSettings> getAllEmailSettings();
    void updateEmailSettings(EmailSettings emailSettings);
    void deleteEmailSettings(Long id);
}
