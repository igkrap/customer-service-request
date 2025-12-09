package com.example.customerservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagDocument {
    private Long id;
    private String title;
    private String content;
    private float[] embedding; // pgvector embedding
    private Integer embeddingDimension; // actual dimension used (768, 1536, 3072 etc.)
    private String metadata; // JSON string
    private String category;
    private Boolean enabled;
    private Long uploadedByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
