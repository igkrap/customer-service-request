package com.example.customerservice.service;

import com.example.customerservice.dto.ServiceRequestDTO;
import com.example.customerservice.mapper.CompanyMapper;
import com.example.customerservice.mapper.ProjectMapper;
import com.example.customerservice.mapper.ServiceRequestHistoryMapper;
import com.example.customerservice.mapper.ServiceRequestMapper;
import com.example.customerservice.mapper.UserMapper;
import com.example.customerservice.model.ServiceRequest;
import com.example.customerservice.model.ServiceRequestHistory;
import com.example.customerservice.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceRequestServiceWorkflowTest {

    @Mock
    private ServiceRequestMapper serviceRequestMapper;

    @Mock
    private ServiceRequestHistoryMapper serviceRequestHistoryMapper;

    @Mock
    private CompanyMapper companyMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private AttachmentService attachmentService;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ServiceRequestService serviceRequestService;

    @Test
    void assignServiceRequestMovesToAssignedAndRecordsHistory() {
        ServiceRequest request = request(ServiceRequest.RequestStatus.TRIAGE);
        User manager = user(2L, "manager", User.Role.ROLE_MANAGER);
        User actor = user(99L, "admin", User.Role.ROLE_ADMIN);

        when(serviceRequestMapper.findById(10L)).thenReturn(Optional.of(request));
        when(userMapper.findById(2L)).thenReturn(Optional.of(manager));
        when(userMapper.findById(99L)).thenReturn(Optional.of(actor));
        when(userMapper.findById(1L)).thenReturn(Optional.empty());

        ServiceRequestDTO result = serviceRequestService.assignServiceRequest(10L, 2L, "배정", 99L);

        assertThat(result.getStatus()).isEqualTo(ServiceRequest.RequestStatus.ASSIGNED);
        assertThat(result.getManagerId()).isEqualTo(2L);
        assertThat(result.getAssignedAt()).isNotBlank();

        ArgumentCaptor<ServiceRequestHistory> historyCaptor = ArgumentCaptor.forClass(ServiceRequestHistory.class);
        verify(serviceRequestHistoryMapper).insert(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEventType()).isEqualTo("MANAGER_ASSIGNED");
        assertThat(historyCaptor.getValue().getFromStatus()).isEqualTo("TRIAGE");
        assertThat(historyCaptor.getValue().getToStatus()).isEqualTo("ASSIGNED");
    }

    @Test
    void closeServiceRequestMovesResolvedToClosed() {
        ServiceRequest request = request(ServiceRequest.RequestStatus.RESOLVED);
        when(serviceRequestMapper.findById(10L)).thenReturn(Optional.of(request));
        when(userMapper.findById(any())).thenReturn(Optional.empty());

        ServiceRequestDTO result = serviceRequestService.closeServiceRequest(10L, "확인", 1L);

        assertThat(result.getStatus()).isEqualTo(ServiceRequest.RequestStatus.CLOSED);
        assertThat(result.getClosedAt()).isNotBlank();

        ArgumentCaptor<ServiceRequestHistory> historyCaptor = ArgumentCaptor.forClass(ServiceRequestHistory.class);
        verify(serviceRequestHistoryMapper).insert(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEventType()).isEqualTo("CUSTOMER_CLOSED");
        assertThat(historyCaptor.getValue().getFromStatus()).isEqualTo("RESOLVED");
        assertThat(historyCaptor.getValue().getToStatus()).isEqualTo("CLOSED");
    }

    @Test
    void rejectResolutionMovesResolvedToReopened() {
        ServiceRequest request = request(ServiceRequest.RequestStatus.RESOLVED);
        when(serviceRequestMapper.findById(10L)).thenReturn(Optional.of(request));
        when(userMapper.findById(any())).thenReturn(Optional.empty());

        ServiceRequestDTO result = serviceRequestService.rejectResolution(10L, "추가 처리 필요", 1L);

        assertThat(result.getStatus()).isEqualTo(ServiceRequest.RequestStatus.REOPENED);
        assertThat(result.getReopenedAt()).isNotBlank();

        ArgumentCaptor<ServiceRequestHistory> historyCaptor = ArgumentCaptor.forClass(ServiceRequestHistory.class);
        verify(serviceRequestHistoryMapper).insert(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getEventType()).isEqualTo("RESOLUTION_REJECTED");
        assertThat(historyCaptor.getValue().getFromStatus()).isEqualTo("RESOLVED");
        assertThat(historyCaptor.getValue().getToStatus()).isEqualTo("REOPENED");
    }

    @Test
    void resolveServiceRequestAllowsEditingSubmittedResolution() {
        ServiceRequest request = request(ServiceRequest.RequestStatus.RESOLVED);
        request.setHoursSpent(1.0);
        request.setResolutionNotes("기존 완료보고");
        request.setResolvedAt("20260520");

        when(serviceRequestMapper.findById(10L)).thenReturn(Optional.of(request));
        when(attachmentService.getAttachmentsByServiceRequestId(10L)).thenReturn(List.of());
        when(userMapper.findById(any())).thenReturn(Optional.empty());

        ServiceRequestDTO result = serviceRequestService.resolveServiceRequest(
                10L,
                2.5,
                "수정된 완료보고",
                List.of(),
                "완료보고 수정",
                2L);

        assertThat(result.getStatus()).isEqualTo(ServiceRequest.RequestStatus.RESOLVED);
        assertThat(result.getHoursSpent()).isEqualTo(2.5);
        assertThat(result.getResolutionNotes()).isEqualTo("수정된 완료보고");
        assertThat(result.getResolvedAt()).isEqualTo("20260520");
        verify(serviceRequestMapper).update(request);
    }

    private ServiceRequest request(ServiceRequest.RequestStatus status) {
        ServiceRequest request = new ServiceRequest();
        request.setId(10L);
        request.setTitle("요청");
        request.setCustomerId(1L);
        request.setStatus(status);
        request.setPriority(ServiceRequest.Priority.MEDIUM);
        request.setReceivedAt("20260520");
        return request;
    }

    private User user(Long id, String userId, User.Role role) {
        User user = new User();
        user.setId(id);
        user.setUserId(userId);
        user.setUsername(userId);
        user.setRole(role);
        return user;
    }
}
