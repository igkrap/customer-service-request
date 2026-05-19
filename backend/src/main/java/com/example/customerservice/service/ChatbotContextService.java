package com.example.customerservice.service;

import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.mapper.ServiceRequestMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.Project;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Provides database context to chatbot based on user queries
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotContextService {

    private final ServiceRequestMapper serviceRequestMapper;
    private final ProjectMapper projectMapper;
    private final UserMapper userMapper;

    /**
     * Analyze user query and fetch relevant database context
     */
    public String getDatabaseContext(String query, String userId) {
        StringBuilder context = new StringBuilder();

        try {
            User user = userMapper.findByUserId(userId).orElse(null);
            if (user == null) {
                return "";
            }

            String lowerQuery = query.toLowerCase();

            // Check for service request related queries
            if (containsAny(lowerQuery, "내 요청", "내 서비스", "내가 등록한", "요청 내역", "요청 확인", "요청 상태")) {
                context.append(getMyServiceRequests(user));
            }

            // Check for project related queries
            if (containsAny(lowerQuery, "내 프로젝트", "프로젝트 목록", "담당 프로젝트", "배정 프로젝트")) {
                context.append(getMyProjects(user));
            }

            // Check for manager-specific queries
            if (user.getRole() == User.Role.ROLE_MANAGER &&
                containsAny(lowerQuery, "담당 요청", "처리할 요청", "배정된 요청")) {
                context.append(getAssignedServiceRequests(user));
            }

            // Check for general statistics queries
            if (containsAny(lowerQuery, "통계", "현황", "요약", "개수")) {
                context.append(getStatistics(user));
            }

        } catch (Exception e) {
            log.error("Error getting database context", e);
        }

        return context.toString();
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String getMyServiceRequests(User user) {
        StringBuilder sb = new StringBuilder("\n\n## 내 서비스 요청 목록\n\n");

        try {
            List<ServiceRequest> requests;
            if (user.getRole() == User.Role.ROLE_CUSTOMER) {
                requests = serviceRequestMapper.findByCustomerId(user.getId());
            } else {
                requests = serviceRequestMapper.findAll();
            }

            if (requests.isEmpty()) {
                sb.append("등록된 서비스 요청이 없습니다.\n");
            } else {
                sb.append("총 ").append(requests.size()).append("건의 요청이 있습니다:\n\n");
                for (ServiceRequest req : requests) {
                    sb.append(String.format("- **[%s]** %s\n", req.getStatus(), req.getTitle()));
                    if (req.getDescription() != null && req.getDescription().length() > 100) {
                        sb.append("  설명: ").append(req.getDescription().substring(0, 100)).append("...\n");
                    } else if (req.getDescription() != null) {
                        sb.append("  설명: ").append(req.getDescription()).append("\n");
                    }
                    sb.append("  우선순위: ").append(req.getPriority()).append("\n");
                    if (req.getCreatedAt() != null) {
                        sb.append("  등록일: ").append(req.getCreatedAt()).append("\n");
                    }
                    sb.append("\n");
                }
            }
        } catch (Exception e) {
            log.error("Error getting service requests", e);
            sb.append("서비스 요청 조회 중 오류가 발생했습니다.\n");
        }

        return sb.toString();
    }

    private String getMyProjects(User user) {
        StringBuilder sb = new StringBuilder("\n\n## 내 프로젝트 목록\n\n");

        try {
            List<Long> projectIds = userMapper.getProjectIdsByUserId(user.getId());

            if (projectIds.isEmpty()) {
                sb.append("배정된 프로젝트가 없습니다.\n");
            } else {
                sb.append("총 ").append(projectIds.size()).append("개의 프로젝트에 배정되어 있습니다:\n\n");
                for (Long projectId : projectIds) {
                    Project project = projectMapper.findById(projectId).orElse(null);
                    if (project != null) {
                        sb.append(String.format("- **%s**\n", project.getProjectName()));
                        sb.append("  서비스 타입: ").append(project.getServiceType()).append("\n");
                        sb.append("  계약 기간: ").append(project.getContractStartDate())
                          .append(" ~ ").append(project.getContractEndDate()).append("\n");
                        sb.append("  계약 M/M: ").append(project.getContractManDays()).append("\n\n");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting projects", e);
            sb.append("프로젝트 조회 중 오류가 발생했습니다.\n");
        }

        return sb.toString();
    }

    private String getAssignedServiceRequests(User user) {
        StringBuilder sb = new StringBuilder("\n\n## 담당 서비스 요청 목록\n\n");

        try {
            List<ServiceRequest> requests = serviceRequestMapper.findByManagerId(user.getId());

            if (requests.isEmpty()) {
                sb.append("현재 담당 중인 요청이 없습니다.\n");
            } else {
                long openCount = requests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.OPEN).count();
                long inProgressCount = requests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS).count();
                long resolvedCount = requests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.RESOLVED
                        || r.getStatus() == ServiceRequest.RequestStatus.CLOSED).count();

                sb.append(String.format("담당 요청: 총 %d건 (대기: %d건, 진행중: %d건, 완료: %d건)\n\n",
                        requests.size(), openCount, inProgressCount, resolvedCount));

                // Show pending requests
                if (openCount > 0) {
                    sb.append("### 대기 중인 요청:\n");
                    requests.stream()
                        .filter(r -> r.getStatus() == ServiceRequest.RequestStatus.OPEN)
                        .limit(5)
                        .forEach(req -> {
                            sb.append(String.format("- %s (우선순위: %s)\n", req.getTitle(), req.getPriority()));
                        });
                    sb.append("\n");
                }
            }
        } catch (Exception e) {
            log.error("Error getting assigned requests", e);
            sb.append("담당 요청 조회 중 오류가 발생했습니다.\n");
        }

        return sb.toString();
    }

    private String getStatistics(User user) {
        StringBuilder sb = new StringBuilder("\n\n## 시스템 현황\n\n");

        try {
            List<ServiceRequest> allRequests = serviceRequestMapper.findAll();
            List<Long> userProjectIds = userMapper.getProjectIdsByUserId(user.getId());

            sb.append(String.format("- 내 프로젝트: %d개\n", userProjectIds.size()));

            if (user.getRole() == User.Role.ROLE_CUSTOMER) {
                List<ServiceRequest> myRequests = serviceRequestMapper.findByCustomerId(user.getId());
                long openCount = myRequests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.OPEN).count();
                long inProgressCount = myRequests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS).count();
                long resolvedCount = myRequests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.RESOLVED
                        || r.getStatus() == ServiceRequest.RequestStatus.CLOSED).count();

                sb.append(String.format("- 내 요청: 총 %d건 (대기: %d, 진행중: %d, 완료: %d)\n",
                        myRequests.size(), openCount, inProgressCount, resolvedCount));
            } else if (user.getRole() == User.Role.ROLE_MANAGER) {
                List<ServiceRequest> assignedRequests = serviceRequestMapper.findByManagerId(user.getId());
                long openCount = assignedRequests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.OPEN).count();
                long inProgressCount = assignedRequests.stream().filter(r -> r.getStatus() == ServiceRequest.RequestStatus.IN_PROGRESS).count();

                sb.append(String.format("- 담당 요청: 총 %d건 (대기: %d, 진행중: %d)\n",
                        assignedRequests.size(), openCount, inProgressCount));
            }

        } catch (Exception e) {
            log.error("Error getting statistics", e);
            sb.append("통계 조회 중 오류가 발생했습니다.\n");
        }

        return sb.toString();
    }
}
