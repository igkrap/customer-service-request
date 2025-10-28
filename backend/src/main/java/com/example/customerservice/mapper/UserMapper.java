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

    @Select("SELECT u.* FROM users u INNER JOIN customer_managers cm ON u.id = cm.customer_id WHERE cm.manager_id = #{managerId}")
    List<User> findCustomersByManagerId(Long managerId);

    @Select("SELECT * FROM users WHERE approval_status = #{approvalStatus}")
    List<User> findByApprovalStatus(@Param("approvalStatus") String approvalStatus);

    @Insert("INSERT INTO users (username, email, password, role, company_id, approval_status, created_at, updated_at) " +
            "VALUES (#{username}, #{email}, #{password}, #{role}, #{companyId}, #{approvalStatus}, #{createdAt}, #{updatedAt})")
    @SelectKey(statement = "SELECT last_insert_rowid()", keyProperty = "id", before = false, resultType = Long.class)
    int insert(User user);

    @Update("UPDATE users SET username = #{username}, email = #{email}, " +
            "role = #{role}, company_id = #{companyId}, approval_status = #{approvalStatus}, updated_at = #{updatedAt} WHERE id = #{id}")
    int update(User user);

    @Update("UPDATE users SET password = #{password}, updated_at = #{updatedAt} WHERE id = #{id}")
    int updatePassword(User user);

    // Customer-Manager relationship methods
    @Insert("INSERT INTO customer_managers (customer_id, manager_id, created_at) " +
            "VALUES (#{customerId}, #{managerId}, #{createdAt})")
    int assignManagerToCustomer(@Param("customerId") Long customerId,
                                 @Param("managerId") Long managerId,
                                 @Param("createdAt") java.time.LocalDateTime createdAt);

    @Delete("DELETE FROM customer_managers WHERE customer_id = #{customerId} AND manager_id = #{managerId}")
    int removeManagerFromCustomer(@Param("customerId") Long customerId, @Param("managerId") Long managerId);

    @Delete("DELETE FROM customer_managers WHERE customer_id = #{customerId}")
    int removeAllManagersFromCustomer(@Param("customerId") Long customerId);

    @Delete("DELETE FROM customer_managers WHERE manager_id = #{managerId}")
    int removeAllCustomersFromManager(@Param("managerId") Long managerId);

    @Select("SELECT manager_id FROM customer_managers WHERE customer_id = #{customerId}")
    List<Long> getManagerIdsByCustomerId(Long customerId);

    @Select("SELECT customer_id FROM customer_managers WHERE manager_id = #{managerId}")
    List<Long> getCustomerIdsByManagerId(Long managerId);

    @Select("SELECT u.* FROM users u INNER JOIN customer_managers cm ON u.id = cm.manager_id WHERE cm.customer_id = #{customerId}")
    List<User> getManagersByCustomerId(Long customerId);

    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
