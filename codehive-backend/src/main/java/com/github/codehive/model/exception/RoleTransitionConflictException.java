package com.github.codehive.model.exception;

import java.util.List;

public class RoleTransitionConflictException extends RuntimeException {
    private final List<String> blockers;

    public RoleTransitionConflictException(List<String> blockers) {
        super("Role transition is blocked by existing relationships");
        this.blockers = List.copyOf(blockers);
    }

    public List<String> getBlockers() { return blockers; }
}
