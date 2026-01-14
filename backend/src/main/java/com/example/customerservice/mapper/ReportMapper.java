package com.example.customerservice.mapper;

import com.example.customerservice.dto.AnnualManagerPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ReportMapper {

    @Select("""
            SELECT
                p.id AS id,
                p.company_id AS company_id,
                c.company_name AS company_name,
                p.project_name AS project_name,
                p.contract_man_days AS planned_man_days,
                COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0) AS actual_man_days,
                COALESCE(SUM(CASE WHEN sr.status <> 'CANCELLED' THEN 1 ELSE 0 END), 0) AS total_requests,
                COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved_requests,
                CASE
                    WHEN p.contract_man_days > 0
                        THEN ROUND(
                            COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0)
                            / p.contract_man_days * 100
                        )
                    ELSE 0
                END AS achievement_rate,
                CASE
                    WHEN COALESCE(SUM(CASE WHEN sr.status <> 'CANCELLED' THEN 1 ELSE 0 END), 0) > 0
                        THEN ROUND(
                            COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN 1 ELSE 0 END), 0)::numeric
                            / COALESCE(SUM(CASE WHEN sr.status <> 'CANCELLED' THEN 1 ELSE 0 END), 0) * 100
                        )
                    ELSE 0
                END AS completion_rate
            FROM projects p
            JOIN companies c ON p.company_id = c.id
            LEFT JOIN service_requests sr ON sr.project_id = p.id
            WHERE (CAST(#{companyId} AS BIGINT) IS NULL
                OR p.company_id = CAST(#{companyId} AS BIGINT))
            GROUP BY p.id, p.company_id, c.company_name, p.project_name, p.contract_man_days
            ORDER BY c.company_name, p.project_name
            """)
    List<CompanyPerformanceDTO> findCompanyPerformance(@Param("companyId") Long companyId);

    @Select("""
            SELECT
                u.id AS id,
                u.username AS manager_name,
                COALESCE(SUM(CASE
                    WHEN sr.status <> 'CANCELLED' AND
                        (CASE
                            WHEN sr.received_at IS NOT NULL AND LENGTH(TRIM(sr.received_at)) >= 4
                                THEN CAST(SUBSTRING(sr.received_at, 1, 4) AS INTEGER)
                            ELSE EXTRACT(YEAR FROM sr.created_at)
                        END) = #{year}
                    THEN 1
                    ELSE 0
                END), 0) AS total_requests,
                COALESCE(SUM(CASE
                    WHEN sr.status = 'RESOLVED' AND
                        (CASE
                            WHEN sr.resolved_at IS NOT NULL AND LENGTH(TRIM(sr.resolved_at)) >= 4
                                THEN CAST(SUBSTRING(sr.resolved_at, 1, 4) AS INTEGER)
                            ELSE EXTRACT(YEAR FROM sr.created_at)
                        END) = #{year}
                    THEN 1
                    ELSE 0
                END), 0) AS resolved_requests,
                COALESCE(SUM(CASE
                    WHEN sr.status = 'RESOLVED' AND
                        (CASE
                            WHEN sr.resolved_at IS NOT NULL AND LENGTH(TRIM(sr.resolved_at)) >= 4
                                THEN CAST(SUBSTRING(sr.resolved_at, 1, 4) AS INTEGER)
                            ELSE EXTRACT(YEAR FROM sr.created_at)
                        END) = #{year}
                    THEN sr.hours_spent
                    ELSE 0
                END), 0) AS hours_spent,
                CASE
                    WHEN COALESCE(SUM(CASE
                        WHEN sr.status <> 'CANCELLED' AND
                            (CASE
                                WHEN sr.received_at IS NOT NULL AND LENGTH(TRIM(sr.received_at)) >= 4
                                    THEN CAST(SUBSTRING(sr.received_at, 1, 4) AS INTEGER)
                                ELSE EXTRACT(YEAR FROM sr.created_at)
                            END) = #{year}
                        THEN 1
                        ELSE 0
                    END), 0) > 0
                        THEN ROUND(
                            COALESCE(SUM(CASE
                                WHEN sr.status = 'RESOLVED' AND
                                    (CASE
                                        WHEN sr.resolved_at IS NOT NULL AND LENGTH(TRIM(sr.resolved_at)) >= 4
                                            THEN CAST(SUBSTRING(sr.resolved_at, 1, 4) AS INTEGER)
                                        ELSE EXTRACT(YEAR FROM sr.created_at)
                                    END) = #{year}
                                THEN 1
                                ELSE 0
                            END), 0)::numeric
                            / COALESCE(SUM(CASE
                                WHEN sr.status <> 'CANCELLED' AND
                                    (CASE
                                        WHEN sr.received_at IS NOT NULL AND LENGTH(TRIM(sr.received_at)) >= 4
                                            THEN CAST(SUBSTRING(sr.received_at, 1, 4) AS INTEGER)
                                        ELSE EXTRACT(YEAR FROM sr.created_at)
                                    END) = #{year}
                                THEN 1
                                ELSE 0
                            END), 0) * 100
                        )
                    ELSE 0
                END AS completion_rate
            FROM users u
            LEFT JOIN service_requests sr ON sr.manager_id = u.id
            WHERE u.role = 'ROLE_MANAGER'
            GROUP BY u.id, u.username
            ORDER BY u.username
            """)
    List<AnnualManagerPerformanceDTO> findAnnualManagerPerformance(@Param("year") int year);
}
