package com.example.customerservice.service;

import com.example.customerservice.dto.RagDocumentDTO;
import com.example.customerservice.mapper.LlmConfigurationMapper;
import com.example.customerservice.mapper.RagDocumentMapper;
import com.example.customerservice.model.LlmConfiguration;
import com.example.customerservice.model.RagDocument;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagDocumentService {

    private final RagDocumentMapper ragDocumentMapper;
    private final LlmConfigurationMapper llmConfigurationMapper;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Transactional
    public RagDocument createRagDocument(RagDocumentDTO dto, Long userId) {
        // Generate embedding for the document content
        float[] embedding = generateEmbedding(dto.getContent());

        RagDocument document = new RagDocument();
        document.setTitle(dto.getTitle());
        document.setContent(dto.getContent());
        document.setEmbedding(embedding);
        document.setCategory(dto.getCategory());
        document.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);
        document.setUploadedByUserId(userId);

        ragDocumentMapper.insertRagDocument(document);
        return document;
    }

    public RagDocument getRagDocumentById(Long id) {
        return ragDocumentMapper.getRagDocumentById(id);
    }

    public List<RagDocument> getAllRagDocuments() {
        return ragDocumentMapper.getAllRagDocuments();
    }

    public List<RagDocument> getAllEnabledRagDocuments() {
        return ragDocumentMapper.getAllEnabledRagDocuments();
    }

    public List<RagDocument> getRagDocumentsByCategory(String category) {
        return ragDocumentMapper.getRagDocumentsByCategory(category);
    }

    @Transactional
    public RagDocument updateRagDocument(Long id, RagDocumentDTO dto) {
        RagDocument document = ragDocumentMapper.getRagDocumentById(id);
        if (document == null) {
            throw new RuntimeException("RAG document not found with id: " + id);
        }

        // Regenerate embedding if content changed
        if (!document.getContent().equals(dto.getContent())) {
            float[] embedding = generateEmbedding(dto.getContent());
            document.setEmbedding(embedding);
        }

        document.setTitle(dto.getTitle());
        document.setContent(dto.getContent());
        document.setCategory(dto.getCategory());
        document.setEnabled(dto.getEnabled());

        ragDocumentMapper.updateRagDocument(document);
        return document;
    }

    @Transactional
    public void deleteRagDocument(Long id) {
        ragDocumentMapper.deleteRagDocument(id);
    }

    private float[] generateEmbedding(String text) {
        try {
            LlmConfiguration config = llmConfigurationMapper.getActiveLlmConfiguration();
            if (config == null) {
                log.warn("No active LLM configuration found, using zero vector");
                return new float[1536];
            }

            WebClient webClient = webClientBuilder.build();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("input", text);
            requestBody.put("model", config.getModelName());

            String response = webClient.post()
                    .uri(config.getApiEndpoint() + "/embeddings")
                    .header("Authorization", "Bearer " + (config.getApiKey() != null ? config.getApiKey() : ""))
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode jsonNode = objectMapper.readTree(response);
            JsonNode embeddingNode = jsonNode.get("data").get(0).get("embedding");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }

            return embedding;

        } catch (Exception e) {
            log.error("Error generating embedding: ", e);
            return new float[1536]; // Return zero vector as fallback
        }
    }
}
