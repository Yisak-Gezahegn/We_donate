# Donation Workflow

Donations can be either financial (money) or material (items).

## Automated Money Donations (Chapa)
- Donors select an amount and pay via Chapa.
- The payment is automatically verified (`SUCCESS`) via webhook.
- The beneficiary is immediately notified.

## Manual Money Donations (Bank Transfer)
- Donors transfer money directly to the provided bank accounts (Telebirr, CBE, BOA, Awash, etc.).
- **Requirement**: The donor MUST enter the Bank Reference Number and upload a screenshot of the receipt.
- **Pending State**: The donation enters a `PENDING` state.
- **Verification Routing**:
  - If the donation is for an **Individual Support Request**, the **Kebele Admin** for that request must verify it.
  - If the donation is for an **Organization Campaign**, the **City Admin** must verify it.
- **Outcome**: The admin reviews the receipt and reference number. They can mark it `SUCCESS` or `FAILED`.
- **Notification**: The beneficiary is ONLY notified after the admin successfully verifies the donation. If rejected, the donor is notified to check their payment info.

## Item Donations
- Donors provide a description of the items, upload a photo, and select a delivery method (e.g., Bring to Office, Coordinate).
- **Rule**: Item donations do **NOT** require a Bank Reference Number.
- **Pending State**: The donation enters a `PENDING` state for coordination.
- **Verification**: The respective Admin (Kebele or City) will coordinate with the donor and mark the donation as `SUCCESS` once the items are received.
