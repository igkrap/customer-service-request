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

    @Select("SELECT a.* FROM attachments a " +
            "JOIN service_request_attachments sra ON a.id = sra.attachment_id " +
            "WHERE sra.service_request_id = #{serviceRequestId}")
    List<Attachment> findByServiceRequestId(Long serviceRequestId);

    @Select("SELECT a.* FROM attachments a " +
            "JOIN comment_attachments ca ON a.id = ca.attachment_id " +
            "WHERE ca.comment_id = #{commentId}")
    List<Attachment> findByCommentId(Long commentId);

    @Delete("DELETE FROM attachments WHERE id = #{id}")
    int delete(Long id);

    @Insert("INSERT INTO service_request_attachments (service_request_id, attachment_id, created_at) " +
            "VALUES (#{serviceRequestId}, #{attachmentId}, CURRENT_TIMESTAMP)")
    int linkToServiceRequest(@Param("serviceRequestId") Long serviceRequestId, @Param("attachmentId") Long attachmentId);

    @Insert("INSERT INTO comment_attachments (comment_id, attachment_id, created_at) " +
            "VALUES (#{commentId}, #{attachmentId}, CURRENT_TIMESTAMP)")
    int linkToComment(@Param("commentId") Long commentId, @Param("attachmentId") Long attachmentId);

    @Delete("DELETE FROM service_request_attachments WHERE service_request_id = #{serviceRequestId} AND attachment_id = #{attachmentId}")
    int unlinkFromServiceRequest(@Param("serviceRequestId") Long serviceRequestId, @Param("attachmentId") Long attachmentId);

    @Delete("DELETE FROM comment_attachments WHERE comment_id = #{commentId} AND attachment_id = #{attachmentId}")
    int unlinkFromComment(@Param("commentId") Long commentId, @Param("attachmentId") Long attachmentId);
}
