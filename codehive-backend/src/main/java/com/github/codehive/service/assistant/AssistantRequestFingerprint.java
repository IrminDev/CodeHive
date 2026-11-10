package com.github.codehive.service.assistant;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import com.github.codehive.model.enums.Language;

public final class AssistantRequestFingerprint {
    private AssistantRequestFingerprint() {}

    public static String of(String message, Language language, boolean editorIncluded,
                            String editorCode, boolean executionIncluded) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            add(digest, message);
            add(digest, language.name());
            add(digest, Boolean.toString(editorIncluded));
            add(digest, editorIncluded ? editorCode : null);
            add(digest, Boolean.toString(executionIncluded));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    private static void add(MessageDigest digest, String value) {
        byte[] bytes = value == null ? new byte[0] : value.getBytes(StandardCharsets.UTF_8);
        digest.update(ByteBuffer.allocate(Integer.BYTES).putInt(bytes.length).array());
        digest.update(bytes);
    }
}
