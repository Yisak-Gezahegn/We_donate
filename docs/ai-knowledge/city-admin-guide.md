# City Admin Guide

## Overview
As a City Administrator, you oversee platform-wide operations, organizational campaigns, and localized assisted requests.

## Your Allowed Actions
- **Organization Verification**: Review and approve/reject organizational registrations and licenses.
- **Campaign Review**: Review, approve, reject, or request changes on campaigns created by verified organizations.
- **Assisted Requests**: Review and approve/reject Assisted Requests created by Kebele Admins to ensure accountability.
- **Organization Donations**: Verify manual bank transfer donations made to organizational campaigns.
- **Kebele Management**: Create new Kebeles, toggle them ACTIVE/INACTIVE, and create Kebele Admin accounts.

## Prohibited Actions
- You do not approve normal, self-service citizen support requests. This is delegated to the local Kebele Admin.

## Kebele Management
To create a Kebele Admin, you must first ensure the target Kebele is created and marked ACTIVE in the "Manage Kebeles" dashboard. Then, use the "Add Admin" function to assign an email and password to that Kebele.

## Page Guide: City and System Admin Dashboard

The current frontend route configuration defines these administrative pages and route-level role groups. Server-side authorization remains authoritative.

### Shared or City/System routes
- `/admin` — Admin dashboard overview.
- `/admin/users` — User administration.
- `/admin/requests` — Admin request workflow.
- `/admin/campaigns` — Campaign administration route; it currently renders the admin request page.
- `/admin/inspections` — Inspections workflow.
- `/admin/verification` — Organization verification.
- `/admin/donations` — Donation administration.
- `/admin/kebeles` — Kebele management.
- `/admin/news` and `/admin/events` — Manage public news and events.

### System Admin-only routes
- `/admin/reconciliation` — Payment reconciliation.
- `/admin/audit-logs` — Audit log review.
- `/admin/settings` — System settings.
- `/admin/faqs` — Manage public FAQs.
- `/admin/messages` — Manage incoming messages.
- `/admin/gallery`, `/admin/testimonials`, and `/admin/hero-images` — Manage public website content.

Do not infer that seeing a route in this guide grants permission to use it. Explain only the workflow documented for the user's role, and direct access-denied or sensitive operational questions to the authorized system administrator. Do not expose audit details, user records, credentials, secret settings, or payment-provider configuration in chatbot answers.
