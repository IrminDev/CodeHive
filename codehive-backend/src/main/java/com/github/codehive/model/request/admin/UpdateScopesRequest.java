package com.github.codehive.model.request.admin;

import java.util.LinkedHashSet;
import java.util.Set;

import com.github.codehive.model.enums.Scope;

import jakarta.validation.constraints.NotNull;

public class UpdateScopesRequest {
    @NotNull
    private Set<Scope> grant = new LinkedHashSet<>();

    @NotNull
    private Set<Scope> revoke = new LinkedHashSet<>();

    public Set<Scope> getGrant() { return grant; }
    public void setGrant(Set<Scope> grant) { this.grant = grant; }
    public Set<Scope> getRevoke() { return revoke; }
    public void setRevoke(Set<Scope> revoke) { this.revoke = revoke; }
}
