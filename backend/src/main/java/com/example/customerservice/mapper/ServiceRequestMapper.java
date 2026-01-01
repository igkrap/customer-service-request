package com.example.customerservice.mapper;

import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.ServiceRequest.Priority;
import com.example.customerservice.model.ServiceRequest.RequestStatus;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ServiceRequestMapper {

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id")
    List<ServiceRequest> findAll();

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.id = #{id}")
    Optional<ServiceRequest> findById(Long id);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.customer_id = #{customerId}")
    List<ServiceRequest> findByCustomerId(Long customerId);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.manager_id = #{managerId}")
    List<ServiceRequest> findByManagerId(Long managerId);

    // Find all service requests accessible by a manager (assigned to them OR related to their projects)
    @Select("SELECT DISTINCT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "LEFT JOIN user_projects up ON sr.project_id = up.project_id " +
            "WHERE sr.manager_id = #{managerId} " +
            "OR (sr.project_id IS NOT NULL AND up.user_id = #{managerId})")
    List<ServiceRequest> findByManagerIdOrProjectAccess(Long managerId);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.status = #{status}")
    List<ServiceRequest> findByStatus(RequestStatus status);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.priority = #{priority}")
    List<ServiceRequest> findByPriority(Priority priority);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.created_by_user_id = #{userId}")
    List<ServiceRequest> findByCreatedByUserId(Long userId);

    @Select("SELECT sr.*, p.project_name AS project_name FROM service_requests sr " +
            "LEFT JOIN projects p ON sr.project_id = p.id " +
            "WHERE sr.parent_id = #{parentId}")
    List<ServiceRequest> findByParentId(Long parentId);

    @Select("SELECT COUNT(*) > 0 FROM service_requests WHERE id = #{id}")
    boolean existsById(Long id);

    @Insert("INSERT INTO service_requests (title, description, status, priority, customer_id, " +
            "manager_id, project_id, created_by_user_id, parent_id, created_at, updated_at, resolved_at, " +
            "hours_spent, resolution_notes, due_date, received_at) " +
            "VALUES (#{title}, #{description}, #{status}, #{priority}, #{customerId}, " +
            "#{managerId}, #{projectId}, #{createdByUserId}, #{parentId}, #{createdAt}, #{updatedAt}, #{resolvedAt}, " +
            "#{hoursSpent}, #{resolutionNotes}, #{dueDate}, #{receivedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(ServiceRequest serviceRequest);

    @Update("UPDATE service_requests SET title = #{title}, description = #{description}, " +
            "status = #{status}, priority = #{priority}, customer_id = #{customerId}, " +
            "manager_id = #{managerId}, project_id = #{projectId}, parent_id = #{parentId}, updated_at = #{updatedAt}, resolved_at = #{resolvedAt}, " +
            "hours_spent = #{hoursSpent}, resolution_notes = #{resolutionNotes}, due_date = #{dueDate}, received_at = #{receivedAt} " +
            "WHERE id = #{id}")
    int update(ServiceRequest serviceRequest);

    @Update("UPDATE service_requests SET manager_id = NULL, status = 'OPEN', " +
            "hours_spent = NULL, resolution_notes = NULL, resolved_at = NULL, " +
            "updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    int unassign(Long id);

    @Delete("DELETE FROM service_requests WHERE id = #{id}")
    int deleteById(Long id);
}
