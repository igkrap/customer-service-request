package com.example.customerservice.mapper;

import com.example.customerservice.model.Project;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ProjectMapper {

    @Select("SELECT * FROM projects")
    List<Project> findAll();

    @Select("SELECT * FROM projects WHERE id = #{id}")
    Optional<Project> findById(Long id);

    @Select("SELECT * FROM projects WHERE company_id = #{companyId}")
    List<Project> findByCompanyId(Long companyId);

    @Insert("INSERT INTO projects (company_id, project_name, service_type, contract_start_date, " +
            "contract_end_date, contract_man_days, created_at, updated_at) " +
            "VALUES (#{companyId}, #{projectName}, #{serviceType}, #{contractStartDate}, " +
            "#{contractEndDate}, #{contractManDays}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(Project project);

    @Update("UPDATE projects SET company_id = #{companyId}, project_name = #{projectName}, " +
            "service_type = #{serviceType}, contract_start_date = #{contractStartDate}, " +
            "contract_end_date = #{contractEndDate}, contract_man_days = #{contractManDays}, " +
            "updated_at = #{updatedAt} WHERE id = #{id}")
    int update(Project project);

    @Delete("DELETE FROM projects WHERE id = #{id}")
    int deleteById(Long id);

    @Select("SELECT COUNT(*) > 0 FROM projects WHERE id = #{id}")
    boolean existsById(Long id);
}
