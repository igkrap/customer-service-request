package com.example.customerservice.mapper;

import com.example.customerservice.config.VectorTypeHandler;
import com.example.customerservice.model.RagDocument;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RagDocumentMapper {

    @Insert("INSERT INTO rag_documents (title, content, embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at) " +
            "VALUES (#{title}, #{content}, #{embedding}::vector, #{embeddingDimension}, #{metadata}::jsonb, #{category}, #{enabled}, #{uploadedByUserId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insertRagDocument(RagDocument ragDocument);

    @Select("SELECT id, title, content, embedding::text as embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE id = #{id}")
    @Results({
        @Result(property = "embedding", column = "embedding", typeHandler = VectorTypeHandler.class)
    })
    RagDocument getRagDocumentById(Long id);

    @Select("SELECT id, title, content, embedding::text as embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE enabled = true ORDER BY created_at DESC")
    @Results({
        @Result(property = "embedding", column = "embedding", typeHandler = VectorTypeHandler.class)
    })
    List<RagDocument> getAllEnabledRagDocuments();

    @Select("SELECT id, title, content, embedding::text as embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents ORDER BY created_at DESC")
    @Results({
        @Result(property = "embedding", column = "embedding", typeHandler = VectorTypeHandler.class)
    })
    List<RagDocument> getAllRagDocuments();

    @Select("SELECT id, title, content, embedding::text as embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE category = #{category} AND enabled = true ORDER BY created_at DESC")
    @Results({
        @Result(property = "embedding", column = "embedding", typeHandler = VectorTypeHandler.class)
    })
    List<RagDocument> getRagDocumentsByCategory(String category);

    @Update("UPDATE rag_documents SET " +
            "title = #{title}, " +
            "content = #{content}, " +
            "embedding = #{embedding}::vector, " +
            "embedding_dimension = #{embeddingDimension}, " +
            "metadata = #{metadata}::jsonb, " +
            "category = #{category}, " +
            "enabled = #{enabled}, " +
            "updated_at = CURRENT_TIMESTAMP " +
            "WHERE id = #{id}")
    void updateRagDocument(RagDocument ragDocument);

    @Delete("DELETE FROM rag_documents WHERE id = #{id}")
    void deleteRagDocument(Long id);

    // Vector similarity search - returns top K most similar documents
    // Only compares with documents of the same embedding dimension
    @Select("SELECT id, title, content, embedding::text as embedding, embedding_dimension, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at, " +
            "1 - (embedding <=> #{queryEmbedding}::vector) as similarity " +
            "FROM rag_documents " +
            "WHERE enabled = true AND embedding_dimension = #{dimension} " +
            "ORDER BY embedding <=> #{queryEmbedding}::vector " +
            "LIMIT #{limit}")
    @Results({
        @Result(property = "embedding", column = "embedding", typeHandler = VectorTypeHandler.class)
    })
    List<RagDocument> findSimilarDocuments(@Param("queryEmbedding") String queryEmbedding, @Param("dimension") int dimension, @Param("limit") int limit);
}
