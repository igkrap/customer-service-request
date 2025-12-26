package com.example.customerservice.mapper;

import com.example.customerservice.model.Company;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CompanyMapper {

    @Select("SELECT * FROM companies")
    List<Company> findAll();

    @Select("SELECT * FROM companies WHERE id = #{id}")
    Optional<Company> findById(Long id);

    @Select("SELECT * FROM companies WHERE company_code = #{companyCode}")
    Optional<Company> findByCompanyCode(String companyCode);

    @Insert("INSERT INTO companies (company_name, company_code, business_number, license_key, created_at, updated_at) " +
            "VALUES (#{companyName}, #{companyCode}, #{businessNumber}, #{licenseKey}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(Company company);

    @Update("UPDATE companies SET company_name = #{companyName}, company_code = #{companyCode}, " +
            "business_number = #{businessNumber}, updated_at = #{updatedAt} WHERE id = #{id}")
    int update(Company company);

    @Delete("DELETE FROM companies WHERE id = #{id}")
    int deleteById(Long id);

    @Select("SELECT COUNT(*) > 0 FROM companies WHERE id = #{id}")
    boolean existsById(Long id);
}
