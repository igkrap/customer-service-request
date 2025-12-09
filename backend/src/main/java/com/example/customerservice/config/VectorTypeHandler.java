package com.example.customerservice.config;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * MyBatis TypeHandler for PostgreSQL vector type
 * Converts between float[] (Java) and vector (PostgreSQL)
 */
@MappedTypes(float[].class)
public class VectorTypeHandler extends BaseTypeHandler<float[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, float[] parameter, JdbcType jdbcType) throws SQLException {
        // Convert float[] to vector string format: [1.0,2.0,3.0]
        StringBuilder sb = new StringBuilder("[");
        for (int j = 0; j < parameter.length; j++) {
            if (j > 0) {
                sb.append(",");
            }
            sb.append(parameter[j]);
        }
        sb.append("]");

        // Cast to vector type in PostgreSQL
        ps.setObject(i, sb.toString(), java.sql.Types.OTHER);
    }

    @Override
    public float[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String vectorString = rs.getString(columnName);
        return parseVector(vectorString);
    }

    @Override
    public float[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String vectorString = rs.getString(columnIndex);
        return parseVector(vectorString);
    }

    @Override
    public float[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String vectorString = cs.getString(columnIndex);
        return parseVector(vectorString);
    }

    /**
     * Parse PostgreSQL vector string format [1.0,2.0,3.0] to float[]
     */
    private float[] parseVector(String vectorString) {
        if (vectorString == null || vectorString.isEmpty()) {
            return null;
        }

        // Remove brackets
        String cleaned = vectorString.trim();
        if (cleaned.startsWith("[")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.endsWith("]")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }

        if (cleaned.isEmpty()) {
            return new float[0];
        }

        // Split by comma and parse to float
        String[] parts = cleaned.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }

        return result;
    }
}
