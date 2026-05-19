package com.example.customerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestActionRequest {
    private Long managerId;
    private String note;
    private String reason;
    private Double hoursSpent;
    private String resolutionNotes;
    private List<AttachmentDTO> attachments;
}
