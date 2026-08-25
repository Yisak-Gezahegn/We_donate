# Support Request Workflow

This workflow applies to normal, self-service requests created by verified citizens.

## Lifecycle
1. **Draft**: The user can save a request as a draft while editing.
2. **Creation**: A verified user submits a request for financial or material aid. (If financial, they must provide payment receiver details).
3. **Review**: The request status becomes `PENDING_REVIEW` and is assigned to the user's Kebele Admin.
4. **Approval**: The Kebele Admin reviews the evidence and clicks Approve. The status becomes `APPROVED`.
5. **Rejection**: The Kebele Admin rejects the request permanently. The status becomes `REJECTED`.
6. **Publication**: An admin publishes the request. It becomes `PUBLISHED` and appears on the public donation board.
7. **Fulfillment**: Once the requested `goalAmount` is successfully reached via verified donations, the request status is automatically changed to `FULFILLED`.
