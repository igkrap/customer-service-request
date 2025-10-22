package com.example.customerservice.mapper;

import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.ServiceRequest.Priority;
import com.example.customerservice.model.ServiceRequest.RequestStatus;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ServiceRequestMapper {

    @Select("SELECT * FROM service_requests")
    List<ServiceRequest> findAll();

    @Select("SELECT * FROM service_requests WHERE id = #{id}")
    Optional<ServiceRequest> findById(Long id);

    @Select("SELECT * FROM service_requests WHERE customer_id = #{customerId}")
    List<ServiceRequest> findByCustomerId(Long customerId);

    @Select("SELECT * FROM service_requests WHERE status = #{status}")
    List<ServiceRequest> findByStatus(RequestStatus status);

    @Select("SELECT * FROM service_requests WHERE priority = #{priority}")
    List<ServiceRequest> findByPriority(Priority priority);

    @Select("SELECT * FROM service_requests WHERE assigned_to = #{assignedTo}")
    List<ServiceRequest> findByAssignedTo(String assignedTo);

    @Select("SELECT COUNT(*) > 0 FROM service_requests WHERE id = #{id}")
    boolean existsById(Long id);

    @Insert("INSERT INTO service_requests (title, description, status, priority, customer_id, " +
            "assigned_to, created_at, updated_at, resolved_at) " +
            "VALUES (#{title}, #{description}, #{status}, #{priority}, #{customerId}, " +
            "#{assignedTo}, #{createdAt}, #{updatedAt}, #{resolvedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ServiceRequest serviceRequest);

    @Update("UPDATE service_requests SET title = #{title}, description = #{description}, " +
            "status = #{status}, priority = #{priority}, customer_id = #{customerId}, " +
            "assigned_to = #{assignedTo}, updated_at = #{updatedAt}, resolved_at = #{resolvedAt} " +
            "WHERE id = #{id}")
    int update(ServiceRequest serviceRequest);

    @Delete("DELETE FROM service_requests WHERE id = #{id}")
    int deleteById(Long id);
}
