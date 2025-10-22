package com.example.customerservice.mapper;

import com.example.customerservice.model.Customer;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CustomerMapper {

    @Select("SELECT * FROM customers")
    List<Customer> findAll();

    @Select("SELECT * FROM customers WHERE id = #{id}")
    Optional<Customer> findById(Long id);

    @Select("SELECT * FROM customers WHERE email = #{email}")
    Optional<Customer> findByEmail(String email);

    @Select("SELECT COUNT(*) > 0 FROM customers WHERE email = #{email}")
    boolean existsByEmail(String email);

    @Select("SELECT COUNT(*) > 0 FROM customers WHERE id = #{id}")
    boolean existsById(Long id);

    @Insert("INSERT INTO customers (name, email, phone_number, company, created_at, updated_at) " +
            "VALUES (#{name}, #{email}, #{phoneNumber}, #{company}, #{createdAt}, #{updatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Customer customer);

    @Update("UPDATE customers SET name = #{name}, email = #{email}, phone_number = #{phoneNumber}, " +
            "company = #{company}, updated_at = #{updatedAt} WHERE id = #{id}")
    int update(Customer customer);

    @Delete("DELETE FROM customers WHERE id = #{id}")
    int deleteById(Long id);
}
