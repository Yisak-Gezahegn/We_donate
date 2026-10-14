# User Guide

## Overview
As a normal citizen or donor on WeDonate, you can request support or make donations to help others.

## Your Allowed Actions
- Register an account and select your Kebele.
- Submit identity verification documents (ID front, ID back, FAN).
- Create support requests for financial or material aid.
- Donate money or items to published support requests and organizational campaigns.
- Manage your profile and view your own requests and donations.

## Prohibited Actions
- You cannot verify other users, approve requests, or access administrative dashboards.

## Verification
- You must verify your identity to create support requests. You do not need to verify to donate.
- You must select an active Kebele from the dropdown. The Kebele Administrator is responsible for reviewing your verification documents.

## Making Donations
- **Money Donations**: Can be made through automated gateways or manual bank transfers. If using a manual bank transfer, you MUST provide a Bank Reference Number and a screenshot of the receipt.
- **Item Donations**: Do NOT require a bank reference number. Simply provide the item description and a photo.

## Getting Help
- Ensure your Kebele is correct if your verification is pending for a long time.
- Make sure you upload clear images for your ID and FAN.

## Page Guide: Public Website and Citizen Dashboard

This section describes the current frontend routes and what each page is for. It contains no account records or private configuration.

### Public pages
- `/` — Home page. Introduces WeDonate and shows current public highlights and platform summaries.
- `/about` — About page. Explains the platform mission, values, and public gallery.
- `/donate` — Browse published support requests and campaigns, filter the lists, open details, and start a donation. The page may request login for actions that require an account. Available donation methods and required proof are shown in the current form; do not assume all methods are available for every target.
- `/register` — Create an account.
- `/login` — Sign in.
- `/payment/success` and `/payment/verify` — Payment result/verification page. A displayed result should be treated as the current payment outcome; if it is unclear, advise the user to check My Donations or contact support rather than claiming a payment succeeded.
- The navigation also provides language and theme controls. These change display preferences, not account permissions.

### Citizen dashboard
These routes are part of the authenticated dashboard experience:
- `/dashboard` — Dashboard overview.
- `/dashboard/profile` — View or update profile information.
- `/dashboard/verification` — Submit or review identity verification information and its status.
- `/dashboard/requests` — View and manage the signed-in user's support requests.
- `/dashboard/donations` — Review the signed-in user's donation history.
- `/dashboard/campaigns` — View the user's campaigns where applicable.
- `/dashboard/notifications` — Review notifications and their read state.
- `/dashboard/donate` — Donation browsing and giving within the dashboard layout.

For questions about a person's actual verification, request, or donation status, use only the chatbot's approved live status tools. Static documentation cannot establish an individual record's current state. Never ask users to send passwords, payment credentials, or identity documents in chat.
