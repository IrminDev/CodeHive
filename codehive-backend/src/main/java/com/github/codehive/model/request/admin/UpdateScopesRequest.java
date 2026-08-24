package com.github.codehive.model.request.admin;

import java.util.LinkedHashSet;
import java.util.Set;

import com.github.codehive.model.enums.Scope;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateScopesRequest {
    @NotNull
    private Set<Scope> grant = new LinkedHashSet<>();

    @NotNull
    private Set<Scope> revoke = new LinkedHashSet<>();

    @NotBlank
    @Size(min = 10, max = 500)
    private String reason;

    private boolean confirmOwnedGroupDeletion;

    public Set<Scope> getGrant() { return grant; }
    public void setGrant(Set<Scope> grant) { this.grant = grant; }
    public Set<Scope> getRevoke() { return revoke; }
    public void setRevoke(Set<Scope> revoke) { this.revoke = revoke; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public boolean isConfirmOwnedGroupDeletion() { return confirmOwnedGroupDeletion; }
    public void setConfirmOwnedGroupDeletion(boolean confirmOwnedGroupDeletion) {
        this.confirmOwnedGroupDeletion = confirmOwnedGroupDeletion;
    }
}
