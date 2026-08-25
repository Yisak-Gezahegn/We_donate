# Notification Workflow

WeDonate uses a real-time notification system to keep users and admins informed.

## Notification Rules
- Notifications are strictly routed based on the user's `role` and `kebeleId`.
- An admin will never receive a notification for an action outside their scope (e.g., a Kebele Admin in K-01 will not receive alerts for K-02).
- Beneficiaries are not notified of "Pending" manual donations to prevent false expectations. They are only notified once the donation is "Verified".

## User Notifications
- "Your verification was approved/rejected."
- "Your support request was approved/rejected."
- "You received a verified donation of ETB <amount>."

## Kebele Admin Notifications
- "New support request pending review" (for their Kebele).
- "Donation pending verification" (for manual money transfers to requests in their Kebele).
- "Assisted request approved/rejected" (feedback from City Admin).

## City Admin Notifications
- "New organization pending verification."
- "New campaign pending review."
- "New assisted request pending City approval."
- "Donation pending verification" (for manual money transfers to campaigns).

## Managing Notifications
- **Unread Badge**: The red notification badge shows the count of unread notifications.
- **Actions**: Users can Mark All Read, delete individual notifications, or Clear All.
- **UI Updates**: The system uses optimistic updates, meaning the red badge count adjusts instantly without requiring a page refresh.
