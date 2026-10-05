package com.github.codehive.model.enums;

public enum GroupDeletionReason {
    OWNER_REQUEST,
    SCOPE_REVOKED,
    ROLE_CHANGED_TO_ADMIN,
    ACCOUNT_DELETED;

    public boolean isTerminal() {
        return this != OWNER_REQUEST;
    }
}
