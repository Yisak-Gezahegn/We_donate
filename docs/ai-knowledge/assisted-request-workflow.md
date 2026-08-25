# Assisted Request Workflow

Assisted requests are support requests created by a Kebele Admin on behalf of a citizen who cannot use the platform themselves.

## Conflict of Interest Protection
To prevent fraud and conflicts of interest, a Kebele Admin **cannot** approve a request that they themselves created. 

## Lifecycle
1. **Creation**: A Kebele Admin creates an "Assisted Citizen" profile, and then creates an "Assisted Request" for that citizen.
2. **Review Routing**: Instead of going to `PENDING_REVIEW` for the Kebele Admin, the request immediately goes to `PENDING_CITY_APPROVAL`.
3. **City Admin Review**: The City Admin reviews the request. They can:
   - **Approve**: Changes status to `APPROVED`.
   - **Reject**: Changes status to `REJECTED`.
   - **Request Changes**: Changes status to `CHANGES_REQUESTED` and sends it back for modifications.
4. **Notification**: The Kebele Admin who created the request is notified of the City Admin's decision.
5. **Publication**: Once approved, the request can be published to the public board for donations.
