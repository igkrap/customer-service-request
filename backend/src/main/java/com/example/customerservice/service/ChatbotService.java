package com.example.customerservice.service;

import com.example.customerservice.dto.ChatRequest;
import com.example.customerservice.dto.ChatResponse;
import com.example.customerservice.mapper.LlmConfigurationMapper;
import com.example.customerservice.mapper.RagDocumentMapper;
import com.example.customerservice.model.LlmConfiguration;
import com.example.customerservice.model.RagDocument;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final LlmConfigurationMapper llmConfigurationMapper;
    private final RagDocumentMapper ragDocumentMapper;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public ChatResponse chat(ChatRequest request) {
        try {
            // 1. Get active LLM configuration
            LlmConfiguration config = llmConfigurationMapper.getActiveLlmConfiguration();
            if (config == null) {
                throw new RuntimeException("No active LLM configuration found. Please configure LLM settings in admin panel.");
            }

            // 2. Generate embedding for user query
            float[] queryEmbedding = generateEmbedding(request.getMessage(), config);
            float[] paddedEmbedding = padEmbedding(queryEmbedding, 3072); // Pad to match DB dimension

            // 3. Search for similar documents in RAG database (same dimension only)
            String embeddingStr = arrayToVectorString(paddedEmbedding);
            List<RagDocument> similarDocs = ragDocumentMapper.findSimilarDocuments(embeddingStr, queryEmbedding.length, 3);

            // 4. Build context from RAG documents
            String context = buildContext(similarDocs);

            // 5. Generate response using LLM with RAG context
            String llmResponse = generateLlmResponse(request.getMessage(), context, config);

            // 6. Extract sources
            List<String> sources = similarDocs.stream()
                    .map(RagDocument::getTitle)
                    .collect(Collectors.toList());

            return new ChatResponse(llmResponse, sources, request.getSessionId());

        } catch (Exception e) {
            log.error("Error in chatbot service: ", e);
            return new ChatResponse(
                    "죄송합니다. 오류가 발생했습니다: " + e.getMessage(),
                    Collections.emptyList(),
                    request.getSessionId()
            );
        }
    }

    private float[] generateEmbedding(String text, LlmConfiguration config) {
        try {
            WebClient webClient = webClientBuilder.build();

            // Build request for embedding endpoint (assuming OpenAI-compatible API)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("input", text);
            requestBody.put("model", config.getEmbeddingModelName());

            String response = webClient.post()
                    .uri(config.getApiEndpoint() + "/embeddings")
                    .header("Authorization", "Bearer " + (config.getApiKey() != null ? config.getApiKey() : ""))
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Parse response to extract embedding
            JsonNode jsonNode = objectMapper.readTree(response);
            JsonNode embeddingNode = jsonNode.get("data").get(0).get("embedding");

            float[] embedding = new float[embeddingNode.size()];
            for (int i = 0; i < embeddingNode.size(); i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }

            return embedding;

        } catch (Exception e) {
            log.error("Error generating embedding: ", e);
            // Return zero vector as fallback
            return new float[1536];
        }
    }

    private String buildContext(List<RagDocument> documents) {
        if (documents.isEmpty()) {
            return "관련 문서를 찾을 수 없습니다.";
        }

        StringBuilder context = new StringBuilder("다음은 관련 참고 자료입니다:\n\n");
        for (int i = 0; i < documents.size(); i++) {
            RagDocument doc = documents.get(i);
            context.append(String.format("[문서 %d: %s]\n%s\n\n", i + 1, doc.getTitle(), doc.getContent()));
        }

        return context.toString();
    }

    private String generateLlmResponse(String userQuery, String context, LlmConfiguration config) {
        try {
            WebClient webClient = webClientBuilder.build();

            // Build system prompt
            String systemPrompt = "당신은 고객 서비스 지원 AI 어시스턴트입니다. " +
                    "제공된 참고 자료를 바탕으로 사용자의 질문에 정확하고 친절하게 답변해주세요. " +
                    "참고 자료에 없는 내용은 답변하지 말고, 모르는 내용은 솔직하게 모른다고 답변하세요.";

            String userPrompt = String.format("%s\n\n사용자 질문: %s", context, userQuery);

            // Build request for chat completion (assuming OpenAI-compatible API)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", config.getModelName());
            requestBody.put("temperature", config.getTemperature());
            requestBody.put("max_tokens", config.getMaxTokens());
            requestBody.put("top_p", config.getTopP());

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userPrompt));
            requestBody.put("messages", messages);

            String response = webClient.post()
                    .uri(config.getApiEndpoint() + "/chat/completions")
                    .header("Authorization", "Bearer " + (config.getApiKey() != null ? config.getApiKey() : ""))
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Parse response
            JsonNode jsonNode = objectMapper.readTree(response);
            return jsonNode.get("choices").get(0).get("message").get("content").asText();

        } catch (Exception e) {
            log.error("Error generating LLM response: ", e);
            throw new RuntimeException("LLM 응답 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private String arrayToVectorString(float[] array) {
        return "[" + Arrays.stream(array)
                .mapToObj(String::valueOf)
                .collect(Collectors.joining(",")) + "]";
    }

    // Pad embedding to target dimension with zeros
    private float[] padEmbedding(float[] embedding, int targetDimension) {
        if (embedding.length >= targetDimension) {
            return embedding;
        }

        float[] paddedEmbedding = new float[targetDimension];
        System.arraycopy(embedding, 0, paddedEmbedding, 0, embedding.length);
        // Remaining elements are automatically 0 in Java
        return paddedEmbedding;
    }
}
