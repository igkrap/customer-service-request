package com.example.customerservice.mapper;

import com.example.customerservice.dto.AnnualManagerPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceDTO;
import com.example.customerservice.dto.CompanyPerformanceMonthlyDTO;
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
                p.contract_man_days
                    * (
                        DATE_PART('year', AGE(p.contract_end_date, p.contract_start_date)) * 12
                        + DATE_PART('month', AGE(p.contract_end_date, p.contract_start_date))
                        + 1
                    ) AS planned_man_days,
                COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0) AS actual_man_days,
                COALESCE(SUM(CASE WHEN sr.status <> 'CANCELLED' THEN 1 ELSE 0 END), 0) AS total_requests,
                COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN 1 ELSE 0 END), 0) AS resolved_requests,
                CASE
                    WHEN p.contract_man_days > 0
                        THEN ROUND(
                            COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0)
                            / (
                                p.contract_man_days
                                * (
                                    DATE_PART('year', AGE(p.contract_end_date, p.contract_start_date)) * 12
                                    + DATE_PART('month', AGE(p.contract_end_date, p.contract_start_date))
                                    + 1
                                )
                            ) * 100
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
            GROUP BY p.id, p.company_id, c.company_name, p.project_name, p.contract_man_days,
                p.contract_start_date, p.contract_end_date
            ORDER BY c.company_name, p.project_name
            """)
    List<CompanyPerformanceDTO> findCompanyPerformance(@Param("companyId") Long companyId);

    @Select("""
            SELECT
                p.id AS project_id,
                c.company_name AS company_name,
                p.project_name AS project_name,
                TO_CHAR(months.month_start, 'YYYY/MM') AS year_month,
                p.contract_man_days AS planned_man_days,
                COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0) AS actual_man_days,
                CASE
                    WHEN p.contract_man_days > 0
                        THEN ROUND(
                            COALESCE(SUM(CASE WHEN sr.status = 'RESOLVED' THEN sr.hours_spent ELSE 0 END), 0)
                            / p.contract_man_days * 100
                        )
                    ELSE 0
                END AS achievement_rate
            FROM projects p
            JOIN companies c ON p.company_id = c.id
            JOIN LATERAL (
                SELECT
                    generate_series(
                        date_trunc('month', p.contract_start_date),
                        date_trunc('month', p.contract_end_date),
                        interval '1 month'
                    ) AS month_start
            ) months ON true
            LEFT JOIN service_requests sr ON sr.project_id = p.id
                AND date_trunc('month',
                    CASE
                        WHEN sr.resolved_at IS NOT NULL AND LENGTH(TRIM(sr.resolved_at)) >= 7
                            THEN TO_DATE(SUBSTRING(sr.resolved_at, 1, 7) || '-01', 'YYYY-MM-DD')
                        ELSE sr.created_at
                    END
                ) = months.month_start
            WHERE p.id = #{projectId}
            GROUP BY p.id, c.company_name, p.project_name, p.contract_man_days, months.month_start
            ORDER BY months.month_start
            """)
    List<CompanyPerformanceMonthlyDTO> findCompanyPerformanceMonthly(@Param("projectId") Long projectId);

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
                    ELSE NULL
                END AS completion_rate
            FROM users u
            LEFT JOIN service_requests sr ON sr.manager_id = u.id
            WHERE u.role = 'ROLE_MANAGER'
            GROUP BY u.id, u.username
            ORDER BY u.username
            """)
    List<AnnualManagerPerformanceDTO> findAnnualManagerPerformance(@Param("year") int year);
}
