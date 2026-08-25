# Verification Workflow

Verification ensures that actors on the platform are real and trustworthy. It is different from request "Approval" or "Authorization".

## Individual Verification (Citizens)
1. **Trigger**: A normal user registers and uploads their ID Front, ID Back, and Family Account Number (FAN).
2. **Requirement**: The user must have a selected `kebeleId`.
3. **Review**: The Kebele Admin for that `kebeleId` receives a notification and sees the user in their pending queue.
4. **Outcome**: The Kebele Admin approves, rejects, or requests changes.
5. **Result**: Upon approval, the user receives a "Verified by Kebele" badge and is allowed to create support requests.

## Organization Verification
1. **Trigger**: An organization registers and uploads their official registration/license document.
2. **Review**: The City Admin receives a notification and sees the organization in their pending queue.
3. **Outcome**: The City Admin approves, rejects, or requests changes.
4. **Result**: Upon approval, the organization receives a "Verified by City Administration" badge and is allowed to create campaigns.

## Special Case: Assisted Citizens
When a Kebele Admin registers an "Assisted Citizen", that user bypasses the normal verification queue and is automatically marked as `VERIFIED` and assigned to that Kebele, because the Kebele Admin physically verified them.
