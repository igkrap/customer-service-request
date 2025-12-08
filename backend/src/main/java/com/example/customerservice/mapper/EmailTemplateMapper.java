package com.example.customerservice.mapper;

import com.example.customerservice.model.EmailTemplate;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface EmailTemplateMapper {
    void insert(EmailTemplate emailTemplate);
    Optional<EmailTemplate> findById(Long id);
    Optional<EmailTemplate> findByTemplateCode(String templateCode);
    List<EmailTemplate> findAll();
    void update(EmailTemplate emailTemplate);
    void deleteById(Long id);
}
