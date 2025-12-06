package com.example.customerservice.service;

import com.example.customerservice.dto.EmailTemplateDTO;
import com.example.customerservice.mapper.EmailTemplateMapper;
import com.example.customerservice.model.EmailTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateMapper emailTemplateMapper;

    @Transactional
    public EmailTemplate createTemplate(EmailTemplateDTO dto) {
        EmailTemplate template = new EmailTemplate();
        template.setTemplateCode(dto.getTemplateCode());
        template.setTemplateName(dto.getTemplateName());
        template.setSubject(dto.getSubject());
        template.setBody(dto.getBody());
        template.setDescription(dto.getDescription());
        template.setVariables(dto.getVariables());
        template.setEnabled(dto.getEnabled());

        emailTemplateMapper.insert(template);
        return template;
    }

    public EmailTemplate getTemplateById(Long id) {
        return emailTemplateMapper.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
    }

    public EmailTemplate getTemplateByCode(String code) {
        return emailTemplateMapper.findByTemplateCode(code)
                .orElseThrow(() -> new RuntimeException("Template not found with code: " + code));
    }

    public List<EmailTemplate> getAllTemplates() {
        return emailTemplateMapper.findAll();
    }

    @Transactional
    public EmailTemplate updateTemplate(Long id, EmailTemplateDTO dto) {
        EmailTemplate template = getTemplateById(id);

        template.setTemplateName(dto.getTemplateName());
        template.setSubject(dto.getSubject());
        template.setBody(dto.getBody());
        template.setDescription(dto.getDescription());
        template.setVariables(dto.getVariables());
        template.setEnabled(dto.getEnabled());

        emailTemplateMapper.update(template);
        return template;
    }

    @Transactional
    public void deleteTemplate(Long id) {
        emailTemplateMapper.deleteById(id);
    }

    /**
     * Process template with variables
     * Replaces {{variableName}} with actual values
     */
    public String processTemplate(String template, Map<String, String> variables) {
        if (template == null || variables == null) {
            return template;
        }

        String result = template;
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");
        Matcher matcher = pattern.matcher(template);

        while (matcher.find()) {
            String variableName = matcher.group(1);
            String value = variables.getOrDefault(variableName, "");
            result = result.replace("{{" + variableName + "}}", value);
        }

        return result;
    }
}
