package com.example.customerservice.mapper;

import com.example.customerservice.model.User;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users")
    List<User> findAll();

    @Select("SELECT * FROM users WHERE id = #{id}")
    Optional<User> findById(Long id);

    @Select("SELECT * FROM users WHERE username = #{username}")
    Optional<User> findByUsername(String username);

    @Select("SELECT * FROM users WHERE email = #{email}")
    Optional<User> findByEmail(String email);

    @Select("SELECT COUNT(*) > 0 FROM users WHERE username = #{username}")
    boolean existsByUsername(String username);

    @Select("SELECT COUNT(*) > 0 FROM users WHERE email = #{email}")
    boolean existsByEmail(String email);

    @Select("SELECT COUNT(*) > 0 FROM users WHERE id = #{id}")
    boolean existsById(Long id);

    @Select("SELECT * FROM users WHERE role = 'ROLE_MANAGER'")
    List<User> findAllManagers();

    @Select("SELECT * FROM users WHERE assigned_manager_id = #{managerId}")
    List<User> findCustomersByManagerId(Long managerId);

    @Insert("INSERT INTO users (username, email, password, role, assigned_manager_id, created_at, updated_at) " +
            "VALUES (#{username}, #{email}, #{password}, #{role}, #{assignedManagerId}, #{createdAt}, #{updatedAt})")
    @SelectKey(statement = "SELECT last_insert_rowid()", keyProperty = "id", before = false, resultType = Long.class)
    int insert(User user);

    @Update("UPDATE users SET username = #{username}, email = #{email}, " +
            "role = #{role}, assigned_manager_id = #{assignedManagerId}, updated_at = #{updatedAt} WHERE id = #{id}")
    int update(User user);

    @Update("UPDATE users SET password = #{password}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updatePassword(User user);

    @Update("UPDATE users SET assigned_manager_id = #{managerId}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updateAssignedManager(@Param("id") Long id, @Param("managerId") Long managerId, @Param("updatedAt") java.time.LocalDateTime updatedAt);

    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
