package com.github.codehive.utils;

import com.github.codehive.model.enums.Language;

public class FileExtensionUtil {
    public static String getFileExtensionByLanguage(Language language) {
        switch (language) {
            case JAVA:
                return "java";
            case PYTHON:
                return "py";
            case CPP:
                return "cpp";
            case C:
                return "c";
            default:
                throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }    
}
