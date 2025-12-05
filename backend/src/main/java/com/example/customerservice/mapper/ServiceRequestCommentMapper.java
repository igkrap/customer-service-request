package com.example.customerservice.mapper;

import com.example.customerservice.model.ServiceRequestComment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ServiceRequestCommentMapper {

    @Insert("INSERT INTO service_request_comments (service_request_id, user_id, comment_text, is_internal, created_at, updated_at) " +
            "VALUES (#{serviceRequestId}, #{userId}, #{commentText}, #{isInternal}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ServiceRequestComment comment);

    @Select("SELECT * FROM service_request_comments WHERE id = #{id}")
    ServiceRequestComment findById(Long id);

    @Select("SELECT * FROM service_request_comments WHERE service_request_id = #{serviceRequestId} ORDER BY created_at ASC")
    List<ServiceRequestComment> findByServiceRequestId(Long serviceRequestId);

    @Update("UPDATE service_request_comments SET comment_text = #{commentText}, updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    int update(ServiceRequestComment comment);

    @Delete("DELETE FROM service_request_comments WHERE id = #{id}")
    int delete(Long id);

    @Delete("DELETE FROM service_request_comments WHERE service_request_id = #{serviceRequestId}")
    int deleteByServiceRequestId(Long serviceRequestId);
}
