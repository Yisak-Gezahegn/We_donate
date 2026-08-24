# SYSTEM ROLES, WORKFLOW, AND APPROVAL AUDIT

## 1. Executive Summary
This document provides a comprehensive audit of the "We Donate" application's current role architecture, business workflows, approval processes, and authorization mechanisms. 

The audit reveals that while the system implements a foundation for a complex hierarchical administration (Kebele, Woreda, City), **the actual backend implementation treats almost all administrators equally, bypassing the intended hierarchy.** Furthermore, several critical financial and auditing anti-patterns exist, such as the ability to permanently hard-delete financial records (donations) and the ability for administrators to approve their own requests. The role system is also unnecessarily fragmented, confusing business entity types with system roles.

## 2. Project Architecture Overview
- **Backend:** Node.js with Express and TypeScript, utilizing Prisma ORM for PostgreSQL.
- **Frontend:** React (Vite) with React Router, utilizing Context API for auth and Tailwind CSS for styling.
- **Authentication:** JWT-based stateless authentication (`auth.middleware.ts`).
- **Authorization:** Role-based access control (RBAC) enforced via a custom `authorize(...roles)` middleware.

## 3. Major System Modules
- **User & Role Management:** Registration, role assignment, and organization verification.
- **Support Requests:** Micro-donations for individuals.
- **Campaigns:** Goal-oriented fundraising for organizations.
- **Donations:** Processing and verification of payments (Chapa and manual bank transfers).
- **Inspections:** Reports verifying the legitimacy of requests/campaigns.
- **Auditing:** Logging of admin actions.

---

## 4. Current Roles
Based on `schema.prisma` and application logic, the following roles currently exist:

| Role | Purpose (Assumed) | Actual Implemented Permissions | Dashboard Access |
|---|---|---|---|
| `USER` | Standard donor / individual requester | Create SupportRequests, donate. | User Dashboard |
| `NGO` | Non-Governmental Organization | Needs verification. Can create Campaigns/Requests. | User Dashboard |
| `ORGANIZATION` | Generic Organization | Exact same as `NGO`. | User Dashboard |
| `GOVERNMENTAL_ORG` | Gov Organization | Exact same as `NGO`. | User Dashboard |
| `KEBELE_ADMIN` | Local Admin | Has full `ADMIN_ROLES` access. Can approve anything. | User & Admin |
| `WOREDA_ADMIN` | District Admin | Exact same as `KEBELE_ADMIN`. | User & Admin |
| `CITY_ADMIN` | City-level Admin | Full admin access + view audit logs + assign roles. | Admin Only |
| `SUPER_ADMIN` | System Owner | Full admin + delete other admins + clear audit logs. | Admin Only |

### Problems Found:
1. **Duplicate Business Roles:** `NGO`, `ORGANIZATION`, and `GOVERNMENTAL_ORG` are completely identical in implementation. They all wait for `orgStatus === 'APPROVED'` and then can create campaigns. This duplicates the `orgType` enum in the database.
2. **Flat Admin Hierarchy:** Despite having `KEBELE`, `WOREDA`, and `CITY` levels, the backend route protection (`const ADMIN_ROLES = ['KEBELE_ADMIN','WOREDA_ADMIN','CITY_ADMIN','SUPER_ADMIN']`) grants all of them identical approval authority. A Kebele Admin can approve city-wide campaigns or verify large donations without any escalation.
3. **Frontend vs. Backend Inconsistency:** The frontend (`App.tsx`) considers only `CITY_ADMIN` and `SUPER_ADMIN` as "High Admins" (blocking them from the user dashboard), but allows Kebele and Woreda admins to access both standard user pages and admin panels.

---

## 5. Role-Permission Matrix

| Action | USER | ORG (Verified) | KEBELE / WOREDA | CITY ADMIN | SUPER ADMIN |
|---|---|---|---|---|---|
| Create Request / Donate | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Campaign | ✗ | ✓ | ✓ | ✓ | ✓ |
| Approve Org / Request | ✗ | ✗ | ✓ | ✓ | ✓ |
| Verify Donation | ✗ | ✗ | ✓ | ✓ | ✓ |
| View Audit Logs | ✗ | ✗ | ✗ | ✓ | ✓ |
| Assign Roles | ✗ | ✗ | ✗ | ✓ | ✓ |
| Delete Users | ✗ | ✗ | ✗ | ✗ | ✓ |
| Clear Audit Logs | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 6. Current Approval Processes

### A. Organization Verification
**Trigger:** User registers with an Org role.
**Current Workflow:**
1. Org registers (Status: `PENDING`).
2. *ANY* Admin (`KEBELE` to `SUPER`) reviews and calls `approveOrganization`.
3. Org Status becomes `APPROVED`, `isVerified` becomes `true`.

### B. Support Request / Campaign Approval
**Trigger:** Verified Org or User submits a request.
**Current Workflow:**
1. User submits (Status: `PENDING`).
2. *ANY* Admin calls `updateRequestStatus` or `updateCampaignStatus` to set it to `APPROVED`.
3. Admin calls `publishRequest` / `publishCampaign` to make it publicly visible.
4. (No tiered approval required).

### Problems Identified in Workflows:
- **Self-Approval:** Admins can create support requests (even on behalf of others) and use their admin privileges to approve and publish their own requests. (`supportRequest.controller.ts` does not check if the approver is the creator).
- **No Hierarchical Escalation:** Large campaigns do not require City Admin approval; a Kebele Admin can approve them.
- **Redundant Steps:** `APPROVED` and `ACTIVE` (for campaigns) are confusing. The admin must update the status to `APPROVED`, and then separately call a `/publish` endpoint.

---

## 7. Current Status/State Transitions

| Entity | Statuses | Problems |
|---|---|---|
| **Organization** | `NONE`, `PENDING`, `APPROVED`, `REJECTED` | Clean, but `NONE` is unnecessary if a standard `USER` doesn't use it. |
| **Request** | `PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`, `CANCELLED` | No state machine enforcement. An admin can manually change a `FULFILLED` request back to `PENDING`. |
| **Campaign** | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `COMPLETED`, `CANCELLED` | Confusing overlap between `APPROVED` and `ACTIVE`. State transitions are arbitrary. |
| **Donation** | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` | Verified donations directly increment raised amounts, but rejecting them later doesn't decrement the amount. |

---

## 8. Unprofessional & High-Risk Behaviors (Security Concerns)

**Evidence from Implementation:**
1. **Financial Record Destruction:** `admin.controller.ts -> deleteUser` and `supportRequest.controller.ts -> deleteRequest`. When an admin deletes a user or a request, Prisma cascades the deletion to **all associated Donations**. Deleting a user destroys the financial records of actual money processed. *This is a critical accounting violation.*
2. **Clearing Audit Logs:** `admin.controller.ts -> clearAuditLogs`. The `SUPER_ADMIN` can permanently wipe the entire `audit_logs` table. In a secure production system, audit logs should be append-only and immutable.
3. **Self-Approval / Conflict of Interest:** An admin can submit a request (or create one on behalf of a target user) and approve it themselves. There is no separation of duties enforced in `updateRequestStatus`.
4. **Arbitrary State Changes:** `updateCampaignStatus` allows an admin to set any status string at any time. A rejected campaign can be forced into `COMPLETED` without validations.

---

## 9. Recommended Future Architecture

The system should be simplified to use a streamlined Role model and robust Permissions.

### Recommended Roles
| Current Role | Recommendation | Reason |
|---|---|---|
| `SUPER_ADMIN` | **Keep** | Retain for technical system administration only. |
| `CITY_ADMIN` | **Rename** to `ADMIN` | Acts as the primary platform administrator/manager. |
| `KEBELE_ADMIN` / `WOREDA_ADMIN` | **Remove** | Since the backend does not implement tiered approvals, these roles create false complexity. If regional filtering is needed, add a `regionId` to users, not a separate role. |
| `NGO`, `ORGANIZATION`, `GOVERNMENTAL_ORG` | **Merge** to `ORGANIZATION` | Use the existing `orgType` field to distinguish them. Roles dictate system access, not business categorization. |
| `USER` | **Keep** | Standard donor/requester. |

### Recommended Approval Workflow
**Creator → Reviewer → Published**
1. User/Org submits Request. Status: `PENDING`.
2. `ADMIN` reviews and clicks "Approve & Publish".
3. Status changes to `PUBLISHED` (Merge `APPROVED` and `ACTIVE`/`isPublished` into a single unified status).
*Constraint:* Backend must verify `req.user.userId !== request.userId` to prevent self-approval.

### Recommended Data Retention (Critical)
- Remove `deleteUser`, `deleteRequest`, and `deleteCampaign` endpoints.
- Replace with `archiveUser` (soft delete) by setting `isActive = false` and anonymizing PII if required by privacy laws, but **never delete Donations**.

---

## 10. Prioritized Modification Plan

| Priority | Problem | Current Behavior | Recommended Change | Risk |
|---|---|---|---|---|
| **CRITICAL** | Financial Data Deletion | `deleteUser` & `deleteRequest` hard-delete donations. | Remove hard deletes. Implement soft-delete (`isActive`). Keep donations immutable. | High (Data Loss) |
| **CRITICAL** | Audit Log Wipe | `SUPER_ADMIN` can `clearAuditLogs`. | Remove `clearAuditLogs` endpoint. Audit logs must be append-only. | High (Compliance) |
| **CRITICAL** | Self-Approval | Admins can approve their own requests/campaigns. | Add `if (req.user.userId === resource.userId) throw Error()` in approval controllers. | High (Fraud) |
| **HIGH** | Redundant Admin Roles | Kebele/Woreda admins have full City Admin powers. | Consolidate into a single `ADMIN` role. Use region tagging if needed later. | Medium |
| **HIGH** | Redundant Org Roles | NGO, Gov, Org are identical roles. | Consolidate into `ORGANIZATION` role. Rely on `orgType` enum. | Low |
| **MEDIUM** | Clunky Statuses | `APPROVED` vs `ACTIVE` vs `isPublished`. | Merge into a strict state machine: `PENDING -> PUBLISHED -> COMPLETED`. | Low |

---
*Note: No code has been modified during this audit phase. Awaiting review before implementing structural changes.*
