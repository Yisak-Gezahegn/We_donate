# Kebele Admin Guide

## Overview
As a Kebele Administrator, you manage the citizens and support requests localized to your specific geographic Kebele.

## Your Allowed Actions
- **Individual Verification**: Review and approve/reject normal users who register in your Kebele.
- **Support Requests**: Review and approve/reject self-service support requests created by verified users in your Kebele.
- **Individual Donations**: Verify manual bank transfer donations made to support requests inside your Kebele.
- **Assisted Citizens**: Register accounts for citizens in your Kebele who lack internet access.
- **Assisted Requests**: Create support requests on behalf of assisted citizens.

## Prohibited Actions
- You cannot verify organizations.
- You cannot review campaigns.
- You cannot approve your own assisted requests (these must be sent to the City Admin).
- You cannot see users, requests, or donations from other Kebeles.

## Assisted Workflow Limitations
To prevent fraud, any "Assisted Request" you create on behalf of a citizen must be reviewed and approved by the City Administration. You will be notified of their decision.

## Page Guide: Kebele Admin Dashboard

The frontend route configuration exposes the following Kebele administration pages. Backend authorization and the administrator's assigned Kebele determine which records can actually be accessed.

- `/admin` — Admin dashboard overview and work summaries.
- `/admin/users` — Manage users (shared admin route); use only within the authority granted to the signed-in role.
- `/admin/requests` — Review support requests (shared admin route); Kebele workflow is for local citizen requests.
- `/admin/inspections` — Inspections workflow (shared admin route).
- `/admin/user-verification` — Individual identity verification.
- `/admin/kebele-donations` — Kebele donation review/verification page; this route is explicitly assigned to Kebele Admins.
- `/admin/campaigns` is routed to the admin request page but is restricted to City and System Admins; it is not a Kebele campaign-review permission.
- Organization verification, city donations, Kebele management, and system-only settings are not Kebele Admin routes.

If a page returns an access error or a record is missing, do not suggest bypassing the restriction. Confirm that the administrator is signed into the correct account and direct them to the responsible City Admin for permissions or cross-Kebele work.
