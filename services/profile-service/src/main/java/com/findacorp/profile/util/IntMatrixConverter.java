package com.findacorp.profile.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class IntMatrixConverter implements AttributeConverter<int[][], String> {

    private static final ObjectMapper OM = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(int[][] attribute) {
        if (attribute == null) return "[]";
        try {
            return OM.writeValueAsString(attribute);
        } catch (Exception e) {
            return "[]";
        }
    }

    @Override
    public int[][] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new int[0][0];
        try {
            return OM.readValue(dbData, int[][].class);
        } catch (Exception e) {
            return new int[0][0];
        }
    }
}
