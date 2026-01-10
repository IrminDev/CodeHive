package com.github.codehive.model.enums;

public enum Scope {
    CREATE_GROUP, // Permission to create groups
    CHECK_ANALYTICS, // Permission to check analytics
    MANAGE_USERS, // Permission to manage users
    SUPER_ADMIN, // Super admin privileges (Eg. create new admins with basic permissions, delete admins, etc)
    MANAGE_GROUPS // Permission to manage groups (Eg. delete groups, add/remove users from groups, etc)
}
