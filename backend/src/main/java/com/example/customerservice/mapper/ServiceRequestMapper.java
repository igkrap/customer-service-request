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

    @Select("SELECT * FROM service_requests WHERE manager_id = #{managerId}")
    List<ServiceRequest> findByManagerId(Long managerId);

    @Select("SELECT * FROM service_requests WHERE status = #{status}")
    List<ServiceRequest> findByStatus(RequestStatus status);

    @Select("SELECT * FROM service_requests WHERE priority = #{priority}")
    List<ServiceRequest> findByPriority(Priority priority);

    @Select("SELECT * FROM service_requests WHERE created_by_user_id = #{userId}")
    List<ServiceRequest> findByCreatedByUserId(Long userId);

    @Select("SELECT COUNT(*) > 0 FROM service_requests WHERE id = #{id}")
    boolean existsById(Long id);

    @Insert("INSERT INTO service_requests (title, description, status, priority, customer_id, " +
            "manager_id, created_by_user_id, created_at, updated_at, resolved_at) " +
            "VALUES (#{title}, #{description}, #{status}, #{priority}, #{customerId}, " +
            "#{managerId}, #{createdByUserId}, #{createdAt}, #{updatedAt}, #{resolvedAt})")
    @SelectKey(statement = "SELECT last_insert_rowid()", keyProperty = "id", before = false, resultType = Long.class)
    int insert(ServiceRequest serviceRequest);

    @Update("UPDATE service_requests SET title = #{title}, description = #{description}, " +
            "status = #{status}, priority = #{priority}, customer_id = #{customerId}, " +
            "manager_id = #{managerId}, updated_at = #{updatedAt}, resolved_at = #{resolvedAt} " +
            "WHERE id = #{id}")
    int update(ServiceRequest serviceRequest);

    @Delete("DELETE FROM service_requests WHERE id = #{id}")
    int deleteById(Long id);
}
