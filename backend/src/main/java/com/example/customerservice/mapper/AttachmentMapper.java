package com.example.customerservice.mapper;

import com.example.customerservice.model.Attachment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AttachmentMapper {

    @Insert("INSERT INTO attachments (original_file_name, stored_file_name, file_path, file_size, content_type, uploaded_by_user_id, created_at) " +
            "VALUES (#{originalFileName}, #{storedFileName}, #{filePath}, #{fileSize}, #{contentType}, #{uploadedByUserId}, CURRENT_TIMESTAMP)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Attachment attachment);

    @Select("SELECT * FROM attachments WHERE id = #{id}")
    Attachment findById(Long id);

    @Select("SELECT a.*, sra.attachment_type AS attachment_type FROM attachments a " +
            "JOIN service_request_attachments sra ON a.id = sra.attachment_id " +
            "WHERE sra.service_request_id = #{serviceRequestId}")
    List<Attachment> findByServiceRequestId(Long serviceRequestId);

    @Delete("DELETE FROM attachments WHERE id = #{id}")
    int delete(Long id);

    @Insert("INSERT INTO service_request_attachments (service_request_id, attachment_id, attachment_type, created_at) " +
            "VALUES (#{serviceRequestId}, #{attachmentId}, #{attachmentType}, CURRENT_TIMESTAMP) " +
            "ON CONFLICT (service_request_id, attachment_id) DO UPDATE SET " +
            "attachment_type = EXCLUDED.attachment_type, " +
            "created_at = EXCLUDED.created_at")
    int linkToServiceRequest(@Param("serviceRequestId") Long serviceRequestId, @Param("attachmentId") Long attachmentId, @Param("attachmentType") String attachmentType);

    @Delete("DELETE FROM service_request_attachments WHERE service_request_id = #{serviceRequestId} AND attachment_id = #{attachmentId}")
    int unlinkFromServiceRequest(@Param("serviceRequestId") Long serviceRequestId, @Param("attachmentId") Long attachmentId);
}
