# Roles and Permissions Reference

A quick reference guide for the WeDonate role model.

| Role | Scope | Key Permissions | Key Restrictions |
|---|---|---|---|
| **USER** | Own Account | Donate, Create Requests | Cannot approve, cannot verify others |
| **ORGANIZATION** | Own Account | Create Campaigns | Cannot approve, cannot verify others |
| **KEBELE_ADMIN** | Specific `kebeleId` | Verify Users (local), Approve Requests (local), Verify Donations (local), Create Assisted Requests | Cannot approve own assisted requests, cannot see other Kebeles, cannot review campaigns |
| **CITY_ADMIN** | Platform-wide | Verify Orgs, Approve Campaigns, Approve Assisted Requests, Verify Donations (Campaigns), Manage Kebeles | Cannot approve normal citizen requests (delegated to Kebele) |
| **SYSTEM_ADMIN** | Platform-wide | Technical oversight, override approvals | General maintenance |

## Security and Privacy
- The system heavily relies on backend authorization.
- Admin dashboards and tool endpoints (e.g., counters) automatically filter queries based on the authenticated user's token (`role` and `kebeleId`).
- Attempting to access out-of-scope records will result in a 403 Forbidden error.
