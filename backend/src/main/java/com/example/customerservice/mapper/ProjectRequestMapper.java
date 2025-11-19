package com.example.customerservice.mapper;

import com.example.customerservice.model.ProjectRequest;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProjectRequestMapper {

    @Select("SELECT * FROM project_requests")
    List<ProjectRequest> findAll();

    @Select("SELECT * FROM project_requests WHERE id = #{id}")
    Optional<ProjectRequest> findById(Long id);

    @Select("SELECT * FROM project_requests WHERE requested_by_user_id = #{userId}")
    List<ProjectRequest> findByRequestedByUserId(Long userId);

    @Select("SELECT * FROM project_requests WHERE request_status = #{status}")
    List<ProjectRequest> findByRequestStatus(@Param("status") String status);

    @Select("SELECT * FROM project_requests WHERE company_id = #{companyId}")
    List<ProjectRequest> findByCompanyId(Long companyId);

    @Insert("INSERT INTO project_requests (requested_by_user_id, company_id, project_name, service_type, " +
            "contract_start_date, contract_end_date, contract_man_days, request_status, created_at, updated_at) " +
            "VALUES (#{requestedByUserId}, #{companyId}, #{projectName}, #{serviceType}, #{contractStartDate}, " +
            "#{contractEndDate}, #{contractManDays}, #{requestStatus}, #{createdAt}, #{updatedAt})")
    @SelectKey(statement = "SELECT last_insert_rowid()", keyProperty = "id", before = false, resultType = Long.class)
    int insert(ProjectRequest projectRequest);

    @Update("UPDATE project_requests SET request_status = #{requestStatus}, " +
            "approved_by_user_id = #{approvedByUserId}, approval_notes = #{approvalNotes}, " +
            "updated_at = #{updatedAt} WHERE id = #{id}")
    int updateStatus(ProjectRequest projectRequest);

    @Update("UPDATE project_requests SET project_name = #{projectName}, service_type = #{serviceType}, " +
            "contract_start_date = #{contractStartDate}, contract_end_date = #{contractEndDate}, " +
            "contract_man_days = #{contractManDays}, updated_at = #{updatedAt} WHERE id = #{id}")
    int update(ProjectRequest projectRequest);

    @Delete("DELETE FROM project_requests WHERE id = #{id}")
    int deleteById(Long id);

    @Select("SELECT COUNT(*) > 0 FROM project_requests WHERE id = #{id}")
    boolean existsById(Long id);
}
