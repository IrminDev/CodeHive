---
type: "query"
date: "2026-07-29T04:28:00.251566+00:00"
question: "When an assignment is cloned, what is expected to be done in the frontend? The teacher will only update the dates?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["CloneAssignmentRequest", ".cloneAssignment()", "Assignment clone", ".publishGeneration()"]
---

# Q: When an assignment is cloned, what is expected to be done in the frontend? The teacher will only update the dates?

## Answer

Expanded from original query via graph vocab: [assignment, clone, frontend, teacher, dates, launch, due, close, target, group, metadata, copy]. Frontend clone flow should ask teacher to select target group and provide launch, due, and close dates. CloneAssignmentRequest contains only those four inputs; it does not accept title, description, limits, languages, examples, reference solution, or test cases. Backend clones metadata and input assets, copies reference/test revisions, and asynchronously regenerates expected outputs. Frontend should show new assignment as processing and refresh until ready or failed. Current graph contains no frontend clone-specific node, so clone UI/API integration is not implemented yet.

## Outcome

- Signal: useful

## Source Nodes

- CloneAssignmentRequest
- .cloneAssignment()
- Assignment clone
- .publishGeneration()