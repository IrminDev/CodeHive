package com.github.codehive.model.enums;

public enum Scope {
    CREATE_GROUP, // Permission to create groups
    CHECK_ANALYTICS, // Permission to check analytics
    /** @deprecated compatibility alias for non-admin user management. */
    @Deprecated
    MANAGE_USERS,
    VIEW_USERS,
    CREATE_USERS,
    UPDATE_USERS,
    MANAGE_USER_STATUS,
    CREATE_ADMINS,
    UPDATE_ADMINS,
    MANAGE_ADMIN_STATUS,
    MANAGE_SCOPES,
    SUPER_ADMIN,
    MANAGE_GROUPS
}
