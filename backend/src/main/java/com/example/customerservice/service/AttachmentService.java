package com.example.customerservice.service;

import com.example.customerservice.dto.AttachmentDTO;
import com.example.customerservice.mapper.AttachmentMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Attachment;
import com.example.customerservice.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    @Autowired
    private AttachmentMapper attachmentMapper;

    @Autowired
    private UserMapper userMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        try {
            this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }

    public AttachmentDTO uploadFile(MultipartFile file, Long userId) {

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Invalid file path: " + originalFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = new Attachment();
            attachment.setOriginalFileName(originalFileName);
            attachment.setStoredFileName(storedFileName);
            attachment.setFilePath(targetLocation.toString());
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedByUserId(userId);
            attachment.setCreatedAt(LocalDateTime.now());

            attachmentMapper.insert(attachment);

            return convertToDTO(attachment);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName, ex);
        }
    }

    public Resource loadFileAsResource(Long attachmentId) {
        try {
            Attachment attachment = attachmentMapper.findById(attachmentId);
            if (attachment == null) {
                throw new RuntimeException("Attachment not found with id: " + attachmentId);
            }

            Path filePath = Paths.get(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + attachment.getOriginalFileName());
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found", ex);
        }
    }

    public AttachmentDTO getAttachmentById(Long id) {
        Attachment attachment = attachmentMapper.findById(id);
        if (attachment == null) {
            throw new RuntimeException("Attachment not found with id: " + id);
        }
        return convertToDTO(attachment);
    }

    public List<AttachmentDTO> getAttachmentsByServiceRequestId(Long serviceRequestId) {
        List<Attachment> attachments = attachmentMapper.findByServiceRequestId(serviceRequestId);
        return attachments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void linkToServiceRequest(Long serviceRequestId, Long attachmentId) {
        attachmentMapper.linkToServiceRequest(serviceRequestId, attachmentId);
    }

    public void deleteAttachment(Long id) {
        Attachment attachment = attachmentMapper.findById(id);
        if (attachment != null) {
            try {
                Path filePath = Paths.get(attachment.getFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException ex) {
                // Log error but continue to delete database entry
            }
            attachmentMapper.delete(id);
        }
    }

    private AttachmentDTO convertToDTO(Attachment attachment) {
        AttachmentDTO dto = new AttachmentDTO();
        dto.setId(attachment.getId());
        dto.setOriginalFileName(attachment.getOriginalFileName());
        dto.setStoredFileName(attachment.getStoredFileName());
        dto.setFilePath(attachment.getFilePath());
        dto.setFileSize(attachment.getFileSize());
        dto.setContentType(attachment.getContentType());
        dto.setUploadedByUserId(attachment.getUploadedByUserId());
        dto.setCreatedAt(attachment.getCreatedAt());

        if (attachment.getUploadedByUserId() != null) {
            User user = userMapper.findById(attachment.getUploadedByUserId()).orElse(null);
            if (user != null) {
                dto.setUploadedByUsername(user.getUsername());
            }
        }

        return dto;
    }
}
