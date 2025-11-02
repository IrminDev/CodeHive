package com.github.codehive.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuccessResponse<T> extends ApiResponse {
    private final T data;

    public SuccessResponse(String message, T data) {
        super(true, message);
        this.data = data;
    }

    public SuccessResponse(T data) {
        super(true, null);
        this.data = data;
    }

    public T getData() {
        return data;
    }
}
