package com.github.codehive.model.request.assistant;
import java.time.Instant;
import java.util.UUID;
/** Explicit, bounded query contract. Dimensions and SQL identifiers never come from client. */
public class AssistantUsageQuery {
    private Instant from, to;
    private UUID userId, groupId, assignmentId;
    private String provider, model, search, sort = "label", direction = "ASC";
    private int page = 0, size = 20;
    private boolean lifetime;
    public Instant getFrom() { return from; }
    public void setFrom(Instant value) { from=value; }
    public Instant getTo() { return to; }
    public void setTo(Instant value) { to=value; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID value) { userId=value; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID value) { groupId=value; }
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID value) { assignmentId=value; }
    public String getProvider() { return provider; }
    public void setProvider(String value) { provider=value; }
    public String getModel() { return model; }
    public void setModel(String value) { model=value; }
    public String getSearch() { return search; }
    public void setSearch(String value) { search=value; }
    public String getSort() { return sort; }
    public void setSort(String value) { sort=value; }
    public String getDirection() { return direction; }
    public void setDirection(String value) { direction=value; }
    public int getPage() { return page; }
    public void setPage(int value) { page=value; }
    public int getSize() { return size; }
    public void setSize(int value) { size=value; }
    public boolean isLifetime() { return lifetime; }
    public void setLifetime(boolean value) { lifetime=value; }
}
