package com.github.codehive.model.response.auth;

import com.github.codehive.model.dto.UserDTO;

public class AuthResponse {
    private String token;
    private UserDTO user;

    public AuthResponse() {
    }

    public AuthResponse(String token, UserDTO user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }
}
