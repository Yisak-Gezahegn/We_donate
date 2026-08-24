# IMPLEMENTATION GAP ANALYSIS

## 1. Executive Summary
This document provides a comprehensive comparison between the existing "We Donate" application implementation and the `WE_DONATE_TARGET_OPERATING_MODEL.md`. The gap analysis reveals significant divergences between the currently implemented, highly flexible but insecure role system, and the target strictly governed business model. The primary focus of the required changes is tightening authorization, implementing strict hierarchical scoping (Kebele vs City), separating technical administration from business approval, and protecting financial/audit records.

## 2. Existing Architecture
- **Roles:** Broad, overlapping (`KEBELE_ADMIN`, `WOREDA_ADMIN`, `CITY_ADMIN`, `SUPER_ADMIN` all share `ADMIN_ROLES`). Redundant organization roles (`NGO`, `GOVERNMENTAL_ORG`, `ORGANIZATION`).
- **Authorization:** Handled via a generic `authorize(...roles)` middleware without object-level scoping.
- **Financial/Audit:** Hard deletions of users and requests cascade to donations. Audit logs can be cleared.
- **Workflow:** Admins can self-approve. State transitions are unconstrained.

## 3. Target Architecture
- **Roles:** `USER`, `ORGANIZATION`, `KEBELE_ADMIN`, `CITY_ADMIN`, `SYSTEM_ADMIN`.
- **Authorization:** Strict RBAC + Object-Level Security (`kebeleId` scoping).
- **Financial/Audit:** Immutable records, soft-deletes (archiving) only.
- **Workflow:** Strict state machines, separation of duties (creator != approver), Kebele-level individual verification vs City-level organization verification.

## 4. Target-vs-Current Matrix

| Requirement | Target Design | Current Implementation | Status | Evidence | Required Change |
| ----------- | ------------- | ---------------------- | ------ | -------- | --------------- |
| Role Consolidation | 5 Core Roles | 8 roles, duplicating org types and flattening admins | INCORRECT_IMPLEMENTATION | `schema.prisma` `enum Role` | Consolidate Org roles. Remove `WOREDA_ADMIN`. Rename `SUPER_ADMIN`. |
| Org Types | `orgType` field handles NGO/Gov differences | Roles used instead of just `orgType` | INCORRECT_IMPLEMENTATION | `admin.controller.ts` `validRoles` | Merge into `ORGANIZATION` role, keep `orgType` enum. |
| Kebele Scoping | `KEBELE_ADMIN` restricted by `kebeleId` | Missing `kebeleId`. Admins see all requests. | NOT_IMPLEMENTED | `schema.prisma`, `supportRequest.controller.ts` | Add `kebeleId` to User/Request. Enforce in controllers. |
| Self-Approval Protection | Creator !== Approver | No check. Admins can approve own requests. | NOT_IMPLEMENTED | `supportRequest.controller.ts` `updateRequestStatus` | Enforce `req.user.userId !== resource.userId` on approval. |
| Org Verification | City Admin only | ANY admin can approve Orgs. | INCORRECT_IMPLEMENTATION | `admin.routes.ts` `approveOrganization` | Restrict to `CITY_ADMIN`. |
| Assisted Requests | `source=ASSISTED`, track `createdBy` | Basic `targetUserId` exists but no formal distinction/workflow. | PARTIALLY_IMPLEMENTED | `supportRequest.controller.ts` `createRequest` | Formalize `source` and `createdBy` vs `beneficiaryId`. |
| Audit Immutability | Append-only. No deletion. | `clearAuditLogs` endpoint exists. | INCORRECT_IMPLEMENTATION | `admin.controller.ts` `clearAuditLogs` | Remove endpoint. Protect table. |
| Financial Immutability | Soft-delete/Archive only | `deleteUser` & `deleteRequest` cascade delete donations. | INCORRECT_IMPLEMENTATION | `admin.controller.ts` `deleteUser` | Replace hard deletes with `isActive = false`. |
| State Machines | Strict transitions | Arbitrary status updates allowed. | INCORRECT_IMPLEMENTATION | `campaign.controller.ts` `updateCampaignStatus` | Implement explicit state transitions in backend. |

## 5. Roles Comparison
- **Current:** `USER`, `NGO`, `ORGANIZATION`, `GOVERNMENTAL_ORG`, `KEBELE_ADMIN`, `WOREDA_ADMIN`, `CITY_ADMIN`, `SUPER_ADMIN`.
- **Target:** `USER`, `ORGANIZATION`, `KEBELE_ADMIN`, `CITY_ADMIN`, `SYSTEM_ADMIN`.
- **Gap:** `NGO` and `GOVERNMENTAL_ORG` need to be merged into `ORGANIZATION`. `WOREDA_ADMIN` is removed. `SUPER_ADMIN` becomes `SYSTEM_ADMIN` with technical-only scope.

## 6. Authorization Comparison
- **Current:** Backend routes are protected by a monolithic `ADMIN_ROLES` array. Any admin can do almost anything.
- **Target:** Role-specific boundaries (`CITY_ADMIN` for Orgs, `KEBELE_ADMIN` for individuals).
- **Gap:** Backend routes must be split or controller logic must verify the specific administrative tier and geographic scope.

## 7. Verification Workflow Comparison
- **Current:** Orgs are verified by ANY admin. Users do not have a dedicated Kebele verification flow.
- **Target:** Users verified by `KEBELE_ADMIN`. Orgs verified by `CITY_ADMIN`.
- **Gap:** Create user verification workflow. Restrict Org verification to `CITY_ADMIN`.

## 8. Support Request Comparison
- **Current:** Can be approved by any admin. Admin can self-approve.
- **Target:** Approved by `KEBELE_ADMIN` (for their Kebele) or escalated. No self-approval.
- **Gap:** Implement Kebele scoping and self-approval block.

## 9. Assisted Request Comparison
- **Current:** Admin can provide `targetUserId`.
- **Target:** Explicit `source = ASSISTED`. Track creator and beneficiary distinctively. Requires secondary review.
- **Gap:** Add `source` enum. Implement secondary review workflow.

## 10. Organization Comparison
- **Current:** Identical roles disguised as different business types.
- **Target:** Single `ORGANIZATION` role, categorized by `orgType`.
- **Gap:** Database migration required to consolidate roles.

## 11. Campaign Comparison
- **Current:** Approved by any admin. Confusing `APPROVED` vs `ACTIVE`.
- **Target:** Approved by `CITY_ADMIN`. Strict `DRAFT -> PENDING_REVIEW -> PUBLISHED` states.
- **Gap:** Implement strict state machine. Restrict approval to `CITY_ADMIN`.

## 12. Donation/Financial Comparison
- **Current:** Donations are hard-deleted when parent records are deleted.
- **Target:** Immutable financial history.
- **Gap:** Remove cascade deletes. Implement soft deletes (archiving).

## 13. Audit Logging Comparison
- **Current:** Logs can be permanently wiped by `SUPER_ADMIN`.
- **Target:** Append-only, fully attributable logs.
- **Gap:** Remove `clearAuditLogs`. Expand logged events.

## 14. State Machine Comparison
- **Current:** Free-form status updates.
- **Target:** Strictly defined transition paths.
- **Gap:** Refactor `updateRequestStatus` and `updateCampaignStatus` to enforce rules.

## 15. Security Findings
- Self-approval is currently possible, enabling fraud.
- Lack of Kebele scoping allows a local admin to approve nation-wide requests.
- Hard-deleting financial records violates accounting standards.

## 16. Existing Testing Assessment
- **Current:** Minimal/no automated integration tests found for workflows. (Requires deeper inspection of `tests` directory if it exists, though none was visible in standard structure).
- **Target:** Comprehensive unit and integration coverage.
- **Gap:** Needs full test suite setup.

## 17. New Unit Tests
- RBAC authorization checks.
- Kebele scoping logic.
- Self-approval prevention.
- State machine transition rules.

## 18. New Integration Tests
- End-to-end Support Request flow (User -> Kebele Admin -> Publish).
- End-to-end Campaign flow (Org -> City Admin -> Publish).
- Financial immutability on parent resource deletion.

## 19. Dockerization Assessment
- **Current:** Docker is used for DB (`setup-database.bat` mentions Postgres running). Need to establish standard `Dockerfile` and `docker-compose.yml`.
- **Gap:** Implement production Dockerfiles and Dev Compose setup.

## 20. Docker Architecture
- Backend: Multi-stage Node image.
- Frontend: Multi-stage Node -> Nginx (or serve).
- DB: Postgres with healthchecks.

## 21. Database Migration Changes
- Add `kebeleId` to `User` and `SupportRequest`.
- Update `Role` enum (requires careful data migration mapping `NGO` -> `ORGANIZATION`).
- Add `source` to `SupportRequest`.

## 22. Frontend Changes
- Update role checks to match new model.
- Build Kebele assignment UI for City Admins.
- Ensure state transition buttons map to valid next states.

## 23. Backend Changes
- Major overhaul of controllers (`supportRequest`, `campaign`, `admin`, `user`).
- Enforce business logic rules laid out in Target Model.

## 24. Remaining Known Gaps
- Exact Kebele assignment mechanism (how does a user declare their Kebele vs Admin assignment).

## 25. Team Decisions Still Required
- **Assisted Requests:** Should Kebele Admin-created requests mandate City Admin approval, or just a second Kebele Admin? (Will implement second Kebele Admin as baseline).
- **Status Model:** Will use `DRAFT -> PENDING_REVIEW -> PUBLISHED -> COMPLETED/FULFILLED`.

## 26. Final Validation Results
*(To be populated after implementation and testing phases are completed)*
