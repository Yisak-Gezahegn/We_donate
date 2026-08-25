# WeDonate System Usage Guide

This is the master knowledge document for the WeDonate platform. It describes the system as it is actively implemented in production.

## 1. System Overview
WeDonate is a centralized platform designed to connect citizens in need with willing donors, while ensuring transparency and accountability through strict administrative oversight.

**Who uses it:**
- Citizens needing support (financial or material)
- Donors wishing to contribute
- Organizations launching larger-scale campaigns
- Kebele Administrators who verify citizens and their localized requests
- City Administrators who verify organizations and their campaigns

**What problems it solves:**
- Prevents fraud by requiring identity and organizational verification
- Ensures local accountability by having Kebele Admins review local requests
- Provides a transparent workflow from request creation to fulfillment

**High-level workflow:**
1. A user registers and gets verified by an admin (Kebele for citizens, City for organizations).
2. The user creates a support request or campaign.
3. The responsible admin reviews and approves the request.
4. The request is published for the public to see.
5. Donors make contributions (money or items).
6. Admins verify manual donations.
7. Once the goal is reached, the request is marked as fulfilled.

---

## 2. Roles

The system uses strict role-based access control.

### USER
- **Purpose**: Normal citizens who want to request support or make donations.
- **Dashboard**: Features "My Requests", "My Donations".
- **Allowed actions**: Donate to any published campaign/request, create support requests (if verified), update profile.
- **Prohibited actions**: Cannot approve requests, verify users, or access admin dashboards.
- **Data scope**: Can only see their own requests, their own donations, and publicly published requests/campaigns.

### KEBELE_ADMIN
- **Purpose**: Manage and oversee activities within a specific, geographically scoped Kebele.
- **Dashboard**: Features counters for pending user verifications, pending requests, and pending donations *only* for their assigned Kebele.
- **Allowed actions**:
  - Verify normal users assigned to their Kebele.
  - Review, approve, or reject normal support requests assigned to their Kebele.
  - Verify individual manual donations made to requests in their Kebele.
  - Create "Assisted Citizens" and "Assisted Requests" on behalf of citizens without internet access.
- **Prohibited actions**: Cannot verify organizations, cannot review campaigns, cannot approve their own assisted requests (must be approved by City Admin), cannot see data for other Kebeles.
- **Data scope**: Strictly limited to `kebeleId`.

### CITY_ADMIN
- **Purpose**: Platform-wide oversight and management of larger entities.
- **Dashboard**: Features counters for pending organization verifications, campaign reviews, assisted requests, and organization donations.
- **Allowed actions**:
  - Verify organizations.
  - Review, approve, request changes, or reject campaigns.
  - Approve or reject "Assisted Requests" created by Kebele Admins.
  - Verify manual donations made to organizational campaigns.
  - Manage Kebeles (create, activate, deactivate) and create Kebele Admin accounts.
- **Prohibited actions**: Cannot approve normal citizen support requests (delegated to Kebele).

### ORGANIZATION
- **Purpose**: Registered entities (NGOs, charities) raising funds for large-scale campaigns.
- **Allowed actions**: Create campaigns (if verified).
- **Approval responsibilities**: None.

### SYSTEM_ADMIN
- **Purpose**: Technical oversight.
- **Allowed actions**: Can override approvals if necessary, but generally reserved for system maintenance.

---

## 3. Normal User Guide

### Registration
- Users register with their First Name, Last Name, Email, and Password.
- **Optional Kebele Selection**: Users can select their local Kebele from a list of currently `ACTIVE` Kebeles during registration. They can also select it later from their profile.

### Verification
- **Kebele requirement**: Users must belong to a Kebele to be verified.
- **Submission**: Users must submit an ID Front, ID Back, and a FAN (Family Account Number).
- **Review**: The Kebele Admin reviews the submission.
- **Outcome**: The Kebele Admin can approve, reject, or request changes.
- **Badge**: Once approved, the user receives a "Verified by Kebele" badge.

### Support Requests
- **Verification requirement**: A user must be `VERIFIED` to submit a request.
- **Creation**: Users create a "Self-Service" request, providing a title, description, category, and goal amount.
- **Financial-aid requirements**: If requesting money, valid payment receiver information (e.g., bank account) must be provided.
- **Kebele approval**: The request enters `PENDING_REVIEW`. The Kebele Admin must approve it.
- **Publication**: Once approved, the City or Kebele Admin can publish it to the public board.
- **Fulfillment**: When the goal amount is reached via donations, it transitions to `FULFILLED`.

### Donations
- **Money donations**: Can be made via automated gateways (Chapa) or manual bank transfers (Telebirr, CBE, etc.).
- **Manual bank transfer**: Requires the donor to input the Bank Reference Number and upload a screenshot of the receipt.
- **Item donations**: Do **NOT** require a bank reference number. Donors provide item details, an image, and select a delivery method.
- **Payment verification**: Manual money donations start as `PENDING`. They must be verified by the Kebele Admin (for individual requests) or City Admin (for campaigns). Item donations also start as `PENDING` for coordination.
- **Notification flow**: The beneficiary is **NOT** notified immediately upon a pending donation. They are only notified *after* the admin successfully verifies the donation.

### Notifications
- Users receive alerts for request status changes, verification updates, and verified donations.
- Notifications can be marked as read, deleted individually, or cleared entirely. Badges update immediately without a page refresh.

---

## 4. Kebele Admin Guide

### Individual Verification
- Kebele Admins review pending users scoped to their `kebeleId`. They can view the ID documents and FAN, then click Approve or Reject.

### Local Individuals
- Kebele Admins can only see and manage users whose `kebeleId` exactly matches the admin's assigned `kebeleId`.

### Assisted Citizens
- A Kebele Admin can manually register an account for a citizen. This citizen is automatically assigned to that Kebele and marked as `VERIFIED`.

### Assisted Support Requests
- Kebele Admins can create support requests on behalf of assisted citizens.
- **Conflict of Interest**: Kebele Admins *cannot* approve requests they created themselves.
- The assisted request goes to `PENDING_CITY_APPROVAL` and must be reviewed by the City Admin.
- The Kebele Admin is notified of the City Admin's decision.

### Normal Support Requests
- A verified normal user creates a request. It appears in the Kebele Admin's dashboard as `PENDING_REVIEW`.
- The Kebele Admin reviews the evidence and approves or rejects it.

### Individual Donations
- If a donor makes a manual money transfer to a support request in the Kebele, it appears in the Kebele Admin's "Verify Payments" queue. The admin verifies the bank reference and receipt.

### Notifications
- Kebele Admins receive notifications when a new support request is submitted in their Kebele, or when a manual donation requires their verification. They do not receive notifications for other Kebeles or City-level campaigns.

---

## 5. City Admin Guide

### Organizations
- Organizations register and must submit a registration document/license.
- The City Admin reviews these documents and approves or rejects the organization. Approved orgs receive a "Verified by City Administration" badge.

### Campaigns
- Verified organizations create campaigns. These enter `PENDING_REVIEW`.
- The City Admin reviews the campaign. They can approve, reject, or request changes.

### Kebele Management
- City Admins can create new Kebeles, toggle them `ACTIVE` or `INACTIVE`, and create Kebele Admin accounts assigned to specific Kebeles.

### Assisted Requests
- City Admins are responsible for approving "Assisted Requests" created by Kebele Admins to prevent localized fraud.

### Organization Donations
- Manual money transfers made to Organization Campaigns are verified by the City Admin.

### Oversight
- City Admins have a broader view of platform statistics (total users, total donations, active campaigns) across all Kebeles.

---

## 6. Verification Rules
- **Identity Verification**: The process of confirming a user or organization is real (ID cards, licenses). Required before creating requests.
- **Authorization**: The system rules preventing actions (e.g., Kebele Admin A cannot view Kebele B's requests).
- **Approval**: The process of an admin reviewing a specific request or campaign and allowing it to proceed.

---

## 7. Request Statuses
Valid transitions for Support Requests and Campaigns:
- `DRAFT`: Being edited by the user.
- `PENDING_REVIEW`: Waiting for Kebele Admin (normal request) or City Admin (campaign).
- `PENDING_CITY_APPROVAL`: Assisted request waiting for City Admin.
- `CHANGES_REQUESTED`: Admin returned it to the user for modifications.
- `APPROVED`: Admin authorized it, but it is not yet public.
- `PUBLISHED`: Visible to the public for donations.
- `REJECTED`: Permanently denied.
- `FULFILLED` / `COMPLETED`: The goal amount was successfully reached.

---

## 8. Donation Statuses
- `PENDING`: Manual bank transfer or item donation awaiting admin verification/coordination.
- `SUCCESS`: Verified by admin (or auto-verified by Chapa).
- `FAILED`: Admin rejected the verification (e.g., invalid receipt).

---

## 9. Notifications
- **Routing**: System strictly routes based on `role` and `kebeleId`.
- **User Notifications**: "Your request was approved", "You received a verified donation."
- **Kebele Notifications**: "New support request pending review", "Donation pending verification".
- **City Notifications**: "New campaign pending review", "Organization pending verification".
- **Semantics**: Read/delete/clear actions trigger optimistic UI updates instantly.

---

## 10. Common Questions

**Why can't I create a support request?**
You must complete your Identity Verification first and be approved by your Kebele.

**How do I select my Kebele?**
You can select it during registration from the dropdown of active Kebeles, or update it later in your profile settings.

**Why can't Kebele approve an assisted request?**
To prevent conflicts of interest and fraud, Kebele Admins cannot approve requests they created themselves. Assisted requests must be approved by the City Admin.

**Do item donations need a bank reference?**
No. Bank references are only required for manual money transfers.

**Who verifies my donation?**
If you donated to an individual support request, the Kebele Admin verifies it. If you donated to an organization's campaign, the City Admin verifies it. Automatic Chapa payments are verified instantly.

**How does City Admin create a Kebele Admin?**
The City Admin navigates to the "Manage Kebeles" dashboard, ensures the target Kebele is created and active, and then uses the "Add Admin" function to create the account and assign it to that Kebele.
