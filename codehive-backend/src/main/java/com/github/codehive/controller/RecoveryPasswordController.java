package com.github.codehive.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.codehive.service.AuthService;
import com.github.codehive.service.RecoveryPasswordService;

@RestController
@RequestMapping("/api/recovery-password")
public class RecoveryPasswordController {
    private final RecoveryPasswordService recoveryPasswordService;

    public RecoveryPasswordController(RecoveryPasswordService recoveryPasswordService) {
        this.recoveryPasswordService = recoveryPasswordService;
    }

}
