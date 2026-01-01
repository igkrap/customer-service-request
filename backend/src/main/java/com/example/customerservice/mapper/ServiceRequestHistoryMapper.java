package com.example.customerservice.mapper;

import com.example.customerservice.model.ServiceRequestHistory;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ServiceRequestHistoryMapper {

    @Insert("INSERT INTO service_request_histories " +
            "(service_request_id, event_type, from_status, to_status, from_manager_id, to_manager_id, note, created_by_user_id, created_at) " +
            "VALUES (#{serviceRequestId}, #{eventType}, #{fromStatus}, #{toStatus}, #{fromManagerId}, #{toManagerId}, #{note}, #{createdByUserId}, #{createdAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(ServiceRequestHistory history);

    @Select("SELECT * FROM service_request_histories WHERE service_request_id = #{serviceRequestId} ORDER BY created_at ASC, id ASC")
    List<ServiceRequestHistory> findByServiceRequestId(Long serviceRequestId);
}
