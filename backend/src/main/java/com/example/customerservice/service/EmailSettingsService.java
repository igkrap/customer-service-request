package com.example.customerservice.service;

import com.example.customerservice.dto.EmailSettingsDTO;
import com.example.customerservice.mapper.EmailSettingsMapper;
import com.example.customerservice.model.EmailSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailSettingsService {

    private final EmailSettingsMapper emailSettingsMapper;

    @Transactional
    public EmailSettings createEmailSettings(EmailSettingsDTO dto) {
        EmailSettings emailSettings = new EmailSettings();
        emailSettings.setSmtpHost(dto.getSmtpHost());
        emailSettings.setSmtpPort(dto.getSmtpPort());
        emailSettings.setSmtpUsername(dto.getSmtpUsername());
        emailSettings.setSmtpPassword(dto.getSmtpPassword());
        emailSettings.setFromEmail(dto.getFromEmail());
        emailSettings.setFromName(dto.getFromName());
        emailSettings.setUseTls(dto.getUseTls());
        emailSettings.setUseSsl(dto.getUseSsl());
        emailSettings.setEnabled(dto.getEnabled());

        emailSettingsMapper.insertEmailSettings(emailSettings);
        return emailSettings;
    }

    public EmailSettings getEmailSettingsById(Long id) {
        return emailSettingsMapper.getEmailSettingsById(id);
    }

    public EmailSettings getActiveEmailSettings() {
        return emailSettingsMapper.getActiveEmailSettings();
    }

    public List<EmailSettings> getAllEmailSettings() {
        return emailSettingsMapper.getAllEmailSettings();
    }

    @Transactional
    public EmailSettings updateEmailSettings(Long id, EmailSettingsDTO dto) {
        EmailSettings emailSettings = emailSettingsMapper.getEmailSettingsById(id);
        if (emailSettings == null) {
            throw new RuntimeException("Email settings not found with id: " + id);
        }

        emailSettings.setSmtpHost(dto.getSmtpHost());
        emailSettings.setSmtpPort(dto.getSmtpPort());
        emailSettings.setSmtpUsername(dto.getSmtpUsername());
        emailSettings.setSmtpPassword(dto.getSmtpPassword());
        emailSettings.setFromEmail(dto.getFromEmail());
        emailSettings.setFromName(dto.getFromName());
        emailSettings.setUseTls(dto.getUseTls());
        emailSettings.setUseSsl(dto.getUseSsl());
        emailSettings.setEnabled(dto.getEnabled());

        emailSettingsMapper.updateEmailSettings(emailSettings);
        return emailSettings;
    }

    @Transactional
    public void deleteEmailSettings(Long id) {
        emailSettingsMapper.deleteEmailSettings(id);
    }
}
