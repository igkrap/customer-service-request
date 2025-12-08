package com.example.customerservice.mapper;

import com.example.customerservice.model.RagDocument;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface RagDocumentMapper {

    @Insert("INSERT INTO rag_documents (title, content, embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at) " +
            "VALUES (#{title}, #{content}, #{embedding}::vector, #{metadata}::jsonb, #{category}, #{enabled}, #{uploadedByUserId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insertRagDocument(RagDocument ragDocument);

    @Select("SELECT id, title, content, embedding::text as embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE id = #{id}")
    RagDocument getRagDocumentById(Long id);

    @Select("SELECT id, title, content, embedding::text as embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE enabled = true ORDER BY created_at DESC")
    List<RagDocument> getAllEnabledRagDocuments();

    @Select("SELECT id, title, content, embedding::text as embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents ORDER BY created_at DESC")
    List<RagDocument> getAllRagDocuments();

    @Select("SELECT id, title, content, embedding::text as embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at " +
            "FROM rag_documents WHERE category = #{category} AND enabled = true ORDER BY created_at DESC")
    List<RagDocument> getRagDocumentsByCategory(String category);

    @Update("UPDATE rag_documents SET " +
            "title = #{title}, " +
            "content = #{content}, " +
            "embedding = #{embedding}::vector, " +
            "metadata = #{metadata}::jsonb, " +
            "category = #{category}, " +
            "enabled = #{enabled}, " +
            "updated_at = CURRENT_TIMESTAMP " +
            "WHERE id = #{id}")
    void updateRagDocument(RagDocument ragDocument);

    @Delete("DELETE FROM rag_documents WHERE id = #{id}")
    void deleteRagDocument(Long id);

    // Vector similarity search - returns top K most similar documents
    @Select("SELECT id, title, content, embedding::text as embedding, metadata, category, enabled, uploaded_by_user_id, created_at, updated_at, " +
            "1 - (embedding <=> #{queryEmbedding}::vector) as similarity " +
            "FROM rag_documents " +
            "WHERE enabled = true " +
            "ORDER BY embedding <=> #{queryEmbedding}::vector " +
            "LIMIT #{limit}")
    List<RagDocument> findSimilarDocuments(@Param("queryEmbedding") String queryEmbedding, @Param("limit") int limit);
}
