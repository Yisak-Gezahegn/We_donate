# WeDonate Internship Project Analysis and Audit

## 1. Project Overview

**WeDonate** is a full-stack web-based community support and charity management system developed for the **Adama City Administration, Oromia, Ethiopia**.

The system connects:

- Citizens requesting assistance
- Individual donors
- Non-governmental and charitable organizations
- Kebele administrations
- Adama City administrators
- System administrators

Its purpose is to digitize donation management, beneficiary verification, fundraising campaigns, payment processing, administrative review, communication, reporting, and community-support workflows.

Primary project documentation is available in:

- `README.md`
- `FRESH_CLONE_SETUP_AND_RUN_GUIDE.md`
- `docs/srs.txt`
- `docs/ai-knowledge/`

## 2. Problems Addressed

The project was designed to solve problems in traditional charity-management processes, including:

- Paper-based beneficiary records
- Limited transparency about donations
- Difficult beneficiary verification
- Duplicate or fraudulent support requests
- Poor donation tracking
- Manual report preparation
- Weak communication between donors and administrators
- High administrative workload
- Limited access to donation services
- Difficulty monitoring campaign progress and distributions

## 3. Main Objectives

The main objectives are to:

1. Create a centralized charity-management platform.
2. Verify beneficiaries through appropriate administrative structures.
3. Allow donors to make financial and physical-item donations.
4. Support fundraising campaigns for organizations.
5. Enable Kebele administrators to create requests for citizens without digital access.
6. Track donation and payment status.
7. Provide role-based dashboards.
8. Improve accountability through audit logs.
9. Support multilingual users.
10. Provide an AI assistant for platform guidance and administrative information.

## 4. System Architecture

The system uses a three-layer architecture.

### 4.1 Presentation Layer

The presentation layer is implemented as a React single-page application.

Technologies include:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form
- Framer Motion
- i18next
- Axios
- Lucide React

The frontend source is located in `wedonate-frontend/src`.

### 4.2 Business Logic Layer

The business logic layer is implemented as a REST API using:

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Multer file uploads
- Chapa payment integration

The backend entry point is `wedonate-backend/src/index.ts`.

### 4.3 Data Storage Layer

The system uses:

- PostgreSQL
- Prisma ORM
- PostgreSQL `pgvector` extension for chatbot embeddings

The database design is defined in `wedonate-backend/prisma/schema.prisma`.

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL with pgvector |
| Authentication | JWT and bcrypt |
| Payments | Chapa and manual bank-transfer reconciliation |
| AI | Google Gemini, embeddings, retrieval-augmented generation |
| Testing | Jest and Supertest |
| Deployment | Docker Compose, Docker, Nginx |

## 6. User Roles

### 6.1 USER

A normal citizen can:

- Register and log in
- Manage a profile
- Select a Kebele
- Submit identity verification documents
- Create support requests after verification
- Donate to campaigns and support requests
- View personal donations
- Receive notifications
- Use the chatbot

### 6.2 ORGANIZATION

An organization can:

- Register as an NGO, governmental organization, religious organization, or private charity
- Submit registration and license information
- Wait for administrator verification
- Create fundraising campaigns after approval
- Publish campaign updates
- Upload success or impact photos
- Receive donations

### 6.3 KEBELE_ADMIN

A Kebele administrator can:

- Review citizens within the assigned Kebele
- Review identity-verification requests
- Create assisted support requests
- Monitor local donations
- Review and verify donations
- Submit inspection reports
- Manage local community-support activities

### 6.4 CITY_ADMIN

A City administrator can:

- Review organizations
- Approve or reject campaigns
- Manage support requests requiring city approval
- Manage Kebeles
- Review donations
- Manage public news and events
- Review inspection and verification data

### 6.5 SYSTEM_ADMIN

A system administrator has the highest level of control and can:

- Manage system users
- Assign roles
- Manage audit logs
- Manage settings
- Manage FAQs, gallery, testimonials, hero images, and messages
- Manage system-wide content
- Perform administrative maintenance

Role definitions are implemented in the Prisma schema and authorization middleware.

## 7. Main Functional Modules

### 7.1 Authentication

The authentication module supports:

- User registration
- Organization registration
- Login
- JWT token generation
- Current-user retrieval
- Token refresh
- Password hashing using bcrypt
- Login audit logging

Relevant files:

- `wedonate-backend/src/controllers/auth.controller.ts`
- `wedonate-backend/src/routes/auth.routes.ts`
- `wedonate-backend/src/middleware/auth.middleware.ts`

### 7.2 Profile and Identity Verification

Users can submit:

- National ID front image
- National ID back image
- FAN number
- Kebele information

Administrators can:

- Approve verification
- Reject verification
- Request changes
- Suspend accounts

Organizations submit:

- Organization name
- Organization type
- License number
- Registration documents
- Representative information
- Office address
- License expiry dates

### 7.3 Support Requests

Support requests may be created in two ways:

1. **Self-service requests** created by verified citizens.
2. **Assisted requests** created by Kebele administrators on behalf of citizens who cannot access the system.

Support requests contain:

- Title
- Description
- Category
- Urgency level
- Goal amount
- Location
- Family size
- Contact information
- Payment-account details
- Support documents
- Beneficiary identity information

Request states include:

`DRAFT`, `PENDING_REVIEW`, `PENDING_CITY_APPROVAL`, `APPROVED`, `PUBLISHED`, `FULFILLED`, `REJECTED`, `CANCELLED`, and `ARCHIVED`.

### 7.4 Fundraising Campaigns

Verified organizations can create campaigns with:

- Title and description
- Category
- Financial target
- Deadline
- Campaign image
- Bank and mobile-payment details
- Contact information
- Campaign updates
- Success photos and notes

Campaign states include:

`DRAFT`, `PENDING_REVIEW`, `CHANGES_REQUESTED`, `PUBLISHED`, `COMPLETED`, `REJECTED`, `SUSPENDED`, `CANCELLED`, and `ARCHIVED`.

### 7.5 Donations

The platform supports:

- Authenticated donations
- Guest donations
- Financial donations
- Food donations
- Clothing donations
- Medicine donations
- Other physical-item donations
- Anonymous donations

Payment methods include:

- Chapa
- TeleBirr
- Commercial Bank of Ethiopia
- Bank of Abyssinia
- Awash Bank
- Other banks
- Physical delivery

Donation statuses include:

`PENDING`, `SUCCESS`, `FAILED`, and `REFUNDED`.

### 7.6 Payment Processing

The system integrates with Chapa for online payments and supports manual payment reconciliation using uploaded payment proofs or reference codes.

Relevant files:

- `wedonate-backend/src/controllers/payment.controller.ts`
- `wedonate-backend/src/routes/payment.routes.ts`
- `wedonate-frontend/src/pages/admin/PaymentReconciliationPage.tsx`

### 7.7 Notifications

Users receive notifications related to:

- Verification decisions
- Donation status
- Support-request status
- Campaign activity
- Administrative actions

### 7.8 Messaging

The internal messaging system supports:

- Contact forms
- User-to-user messages
- Inbox
- Sent messages
- Unread-message counts
- Broadcast messages
- Read-status updates

### 7.9 Audit Logging

Important system activities are recorded in `AuditLog`, including:

- Login events
- Verification actions
- Campaign approvals
- Support-request state changes
- Administrative actions

### 7.10 Inspection Reports

Administrators can create inspection reports for campaigns and support requests. Reports contain:

- Findings
- Recommendations
- Images
- Inspection status

### 7.11 Content Management

Administrators can manage:

- News
- FAQs
- Events
- Gallery images
- Hero images
- Testimonials
- Site settings

### 7.12 AI Chatbot

The chatbot uses:

- Google Gemini
- Retrieval-Augmented Generation
- PostgreSQL vector embeddings
- Role-aware prompts
- User-specific chat history
- Live status tools
- Response caching

The chatbot can answer questions about:

- Registration
- Verification
- Donations
- Support requests
- Campaigns
- Kebele workflows
- City administration workflows

The main implementation is in `wedonate-backend/src/chatbot/chatbot.service.ts`.

## 8. Important Workflows

### 8.1 Citizen Support Workflow

1. Citizen registers.
2. Citizen selects a Kebele.
3. Citizen submits identity documents.
4. Kebele administrator reviews the documents.
5. Citizen is verified or asked to correct the submission.
6. Verified citizen creates a support request.
7. Administrators review the request.
8. Approved request becomes publicly visible.
9. Donors contribute money or physical items.
10. The request is marked fulfilled after assistance is delivered.

### 8.2 Assisted Request Workflow

1. A vulnerable citizen visits or contacts a Kebele office.
2. A Kebele administrator creates a request on the citizen’s behalf.
3. The administrator records beneficiary information and supporting documents.
4. The request is reviewed by city-level administrators.
5. After approval, it is published for donors.
6. Donations are recorded and reconciled.

### 8.3 Organization Campaign Workflow

1. Organization registers.
2. Organization submits licenses and registration information.
3. City administrator reviews the organization.
4. Approved organization creates a campaign.
5. City administrator reviews the campaign.
6. Campaign is published.
7. Donors contribute.
8. Organization posts updates and impact evidence.
9. Campaign is completed or archived.

### 8.4 Donation Workflow

1. Donor selects a support request or campaign.
2. Donor chooses financial or item donation.
3. Donor may donate as a guest or authenticated user.
4. Online payments are initiated through Chapa.
5. Manual donations remain pending until verified.
6. Administrators review payment evidence.
7. Successful donations are recorded.
8. Notifications and fundraising totals are updated.

## 9. Database Design

The main database entities are:

- `User`
- `Kebele`
- `SupportRequest`
- `Campaign`
- `CampaignUpdate`
- `Donation`
- `Notification`
- `AuditLog`
- `GalleryPhoto`
- `HeroImage`
- `Testimonial`
- `News`
- `Faq`
- `Event`
- `SiteSetting`
- `Message`
- `InspectionReport`
- `ChatMessage`
- `KnowledgeDocument`
- `KnowledgeChunk`

The schema supports relationships between:

- Users and Kebeles
- Users and donations
- Users and support requests
- Users and campaigns
- Campaigns and updates
- Campaigns/support requests and donations
- Users and notifications
- Users and audit records
- Documents and vector-search chunks

The migration history includes:

- Initial schema creation
- Requester phone fields
- Schema synchronization
- Assisted-request fields
- Guest donations
- Removal of obsolete campaign registration fields

## 10. API Structure

The backend exposes REST endpoints under the following paths:

- `/api/auth`
- `/api/users`
- `/api/donations`
- `/api/support-requests`
- `/api/campaigns`
- `/api/campaign-updates`
- `/api/admin`
- `/api/payments`
- `/api/notifications`
- `/api/messages`
- `/api/kebeles`
- `/api/upload`
- `/api/gallery`
- `/api/hero-images`
- `/api/testimonials`
- `/api/news`
- `/api/faqs`
- `/api/events`
- `/api/settings`
- `/api/chat`
- `/api/health`

## 11. Frontend Pages

### 11.1 Public Pages

- Home
- About
- Donate
- Login
- Register
- Payment success
- Payment verification

### 11.2 User Dashboard Pages

- Dashboard home
- My donations
- Support requests
- My campaigns
- Notifications
- Profile
- Identity verification

### 11.3 Administration Pages

- Admin dashboard
- User management
- Donation management
- Kebele donations
- Kebele management
- Organization verification
- Individual verification
- Support requests
- Inspections
- Payment reconciliation
- Audit logs
- News
- Events
- FAQs
- Settings
- Messages
- Gallery
- Testimonials
- Hero images

The main route configuration is in `wedonate-frontend/src/App.tsx`.

## 12. Security Controls

Implemented security controls include:

- JWT authentication
- Role-based authorization
- bcrypt password hashing
- Helmet security headers
- CORS configuration
- Global rate limiting
- Chatbot rate limiting
- JSON body-size limits
- File extension and size restrictions
- Kebele-level access scoping
- Anti-self-approval checks
- Audit logging
- Prisma parameterized database queries

## 13. Security Risks Identified

The audit identified the following risks:

1. The upload endpoint appears to be accessible without authentication.
2. Uploaded files are served publicly under `/uploads`.
3. The payment webhook does not appear to independently verify the payment signature.
4. Some public endpoints may expose donor or donation metadata.
5. JWT tokens are stored in browser `localStorage`.
6. Backend request validation is limited despite `express-validator` being installed.
7. The default Docker JWT secret must be replaced before production deployment.
8. Uploaded files are stored inside the backend container and do not have an independent object-storage backup.
9. The frontend and backend have some route-level inconsistencies.
10. Chatbot role coverage is incomplete for some administrative roles.

## 14. Deployment

### 14.1 Local Development

The documented local development ports are:

- PostgreSQL database: `5433`
- Test database: `5434`
- Backend API: `5000`
- Frontend application: `5173`

### 14.2 Docker Deployment

Docker Compose defines:

- PostgreSQL with `pgvector`
- Backend Node.js container
- Frontend Nginx container
- Persistent PostgreSQL volume
- Backend migration execution during startup

Deployment files include:

- `docker-compose.yml`
- `wedonate-backend/Dockerfile`
- `wedonate-frontend/Dockerfile`
- `wedonate-frontend/nginx.conf`

## 15. Testing and Validation Results

The project contains backend Jest/Supertest tests for:

- Kebele scoping
- Donation scoping
- Role permissions
- Assisted requests
- Verification behavior
- Regression cases

Validation performed during the audit:

- Backend TypeScript build: **passed**
- Frontend TypeScript/Vite build: **passed**
- Frontend production bundle generation: **passed**
- Frontend lint: **failed because of unused variables and extensive `any` types**
- Backend integration tests: **could not complete because the PostgreSQL test database at `localhost:5434` was not running**

The frontend production bundle is approximately 1.26 MB minified. Route-based code splitting would improve loading performance.

## 16. Main Limitations

The major limitations identified are:

- Some requirements in the SRS are broader than the current implementation.
- Distribution tracking is not fully represented as an independent workflow.
- Reporting functionality exists in the source but the reports page is not registered in the main frontend route table.
- Payment webhook verification requires stronger security controls.
- File-upload authorization requires improvement.
- Sensitive documents should not be publicly accessible.
- Validation of incoming API data is not comprehensive.
- Automated tests depend on an externally running PostgreSQL test database.
- Frontend linting is not currently clean.
- Uploaded files are not stored in durable external storage.
- Default deployment secrets are unsafe for production.
- The frontend bundle is relatively large.

## 17. Recommended Improvements

The most important improvements are:

1. Authenticate and authorize file uploads.
2. Protect sensitive uploaded documents from public access.
3. Validate Chapa webhook signatures and verify transactions independently.
4. Add stronger request validation using Zod or `express-validator`.
5. Replace `localStorage` JWT storage with secure HTTP-only cookies where practical.
6. Add database indexes for frequently filtered fields.
7. Configure automated database backups.
8. Store uploaded files in durable object storage.
9. Register or remove the currently unreachable reports page.
10. Correct frontend/backend endpoint inconsistencies.
11. Add chatbot role support for organizations and system administrators.
12. Start the test database automatically in continuous integration.
13. Resolve frontend lint errors.
14. Add end-to-end tests for payment, upload authorization, public data exposure, and campaign workflows.
15. Split the frontend bundle using route-based lazy loading.
16. Align the SRS with implemented features, especially distribution tracking, reporting, and privacy controls.
17. Add startup checks for required environment variables.
18. Replace shared seed credentials before any public or production use.
19. Correct Docker documentation and port declarations so they match the actual application configuration.

## 18. Overall Evaluation

WeDonate is a substantial full-stack internship project rather than a simple CRUD application. Its strongest areas are:

- Clear separation between frontend, backend, and database layers
- Multiple user roles
- Kebele-based geographic access control
- Assisted support requests
- Organization campaign management
- Guest and authenticated donations
- Manual and online payment workflows
- Administrative verification
- Audit logging
- Multilingual frontend support
- AI-powered role-aware assistance

The system is suitable for presentation as a functional prototype or pre-production platform. Before real public deployment, the security issues involving uploads, payment webhooks, sensitive donation information, secrets, and database backups should be addressed.

## 19. Conclusion

The WeDonate project demonstrates the application of modern software-engineering technologies to a real community and public-administration problem. It combines a React frontend, an Express backend, a PostgreSQL database, role-based authorization, payment integration, administrative workflows, and an AI assistant into one platform.

From an internship perspective, the project provides practical experience in:

- Requirements analysis
- System architecture
- Database design
- REST API development
- Frontend development
- Authentication and authorization
- File handling
- Payment integration
- Testing
- Docker deployment
- AI and vector-search integration
- Security auditing

The current implementation provides a strong foundation, while the identified security, testing, documentation, and deployment improvements define the next stage required for production readiness.

## 20. Audit Scope Note

This document was prepared from the repository documentation, source-code structure, Prisma schema, routes, controllers, frontend route configuration, deployment files, and available automated checks.

No existing project source files were modified as part of this documentation task. The only addition is this report file: `information.md`.

## 21. Recommendations for the Organization and Future Internship Programs

### 21.1 Recommendations for the Organization

#### Establish Clear Product Ownership

The organization should assign a permanent product owner or project coordinator for WeDonate. This person should collect requirements from city administrators, Kebele administrators, donors, organizations, and citizens; prioritize improvements; approve changes; and coordinate communication between technical and non-technical stakeholders.

#### Define a Production-Readiness Roadmap

Before public deployment, the organization should create a phased roadmap:

1. Resolve security risks involving uploads, payment webhooks, sensitive documents, authentication tokens, and default secrets.
2. Complete database backup, recovery, monitoring, and logging procedures.
3. Validate all major workflows with real administrative users.
4. Deploy the platform first as a controlled pilot in selected Kebeles.
5. Collect feedback and correct operational problems.
6. Expand gradually to additional Kebeles and partner organizations.

#### Improve Data Protection and Privacy

Because the platform stores national identity documents, beneficiary information, phone numbers, payment evidence, and donation records, the organization should establish written data-protection procedures. These should define:

- Who may view each category of information
- How long documents and records are retained
- When information must be deleted or archived
- How users can request correction of inaccurate data
- How suspected data breaches are reported and handled
- How backups are encrypted and protected

#### Strengthen Payment and Financial Controls

The organization should create a formal payment-reconciliation procedure. Every payment should have a verifiable reference, responsible reviewer, approval timestamp, and audit record. Online payment webhooks should be authenticated and independently verified before a donation is marked successful.

Financial reports should distinguish between:

- Pending donations
- Verified donations
- Failed payments
- Refunded donations
- Monetary donations
- Physical-item donations
- Donations assigned to campaigns
- Donations assigned to individual support requests

#### Provide Sustainable Technical Maintenance

The organization should assign technical responsibility after an internship ends. Maintenance responsibilities should include:

- Dependency updates
- Security patches
- Database migrations
- Backup verification
- Error monitoring
- User-support requests
- Deployment management
- Review of audit logs
- Documentation updates

The system should not depend only on the original intern for future operation.

#### Improve Infrastructure and Deployment

The organization should use separate development, testing, staging, and production environments. Production should use:

- Strong environment-specific secrets
- HTTPS
- Restricted database access
- Persistent external file storage
- Automated backups
- Health checks and monitoring
- Centralized application logs
- A documented rollback procedure

Docker configuration, application ports, database versions, and environment variables should be kept consistent across the README, deployment files, and actual runtime configuration.

#### Formalize User Training and Support

Kebele administrators, city administrators, and organizations should receive role-specific training before using the platform. Training should include:

- Account and password management
- Identity verification procedures
- Assisted-request creation
- Donation reconciliation
- Handling of confidential documents
- Inspection reporting
- Fraud and duplicate-request detection
- Incident reporting

Short user manuals and practical demonstrations should be prepared in appropriate local languages, including Afaan Oromoo and Amharic where necessary.

#### Use Feedback as an Operational Requirement

The organization should introduce a feedback channel inside or alongside the platform. Feedback should be categorized into usability problems, workflow problems, data-quality problems, security incidents, and feature requests. This will help the technical team prioritize changes using evidence rather than assumptions.

### 21.2 Recommendations for Future Internship Programs

#### Provide a Defined Internship Scope

At the beginning of each internship, the organization should provide:

- A written problem statement
- Project objectives
- Expected deliverables
- Existing system documentation
- Required technologies
- Access permissions
- Milestones and deadlines
- Evaluation criteria

This allows interns to spend more time solving meaningful problems and less time discovering unclear expectations.

#### Assign a Technical Mentor and a Domain Mentor

Each intern should have:

- A technical mentor who guides architecture, coding, testing, and deployment
- A domain mentor who explains charity-management procedures, government workflows, and user needs

The combination is important because a technically correct feature may still fail if it does not match the organization’s real operational process.

#### Use a Structured Development Process

Future interns should follow a simple development cycle:

1. Understand the problem and stakeholders.
2. Document functional and non-functional requirements.
3. Design the database and system workflow.
4. Break the work into small milestones.
5. Implement features incrementally.
6. Review the work with mentors and users.
7. Add tests for important behavior.
8. Document deployment and maintenance procedures.
9. Demonstrate the completed work.
10. Handover the project and unresolved issues.

#### Require Testing as Part of Every Feature

Internship deliverables should include tests for important access-control, payment, verification, and data-isolation behavior. Each intern should be expected to document:

- What was tested
- What passed
- What could not be tested
- Required test data and environment setup
- Remaining risks

The test database and continuous-integration process should be easy for interns to run without manual infrastructure troubleshooting.

#### Include Security Training

Future interns working on systems containing personal or financial information should receive introductory training in:

- Authentication and authorization
- Secure file uploads
- Input validation
- Password and secret management
- Payment security
- Privacy and least-privilege access
- Secure logging
- Common web vulnerabilities

Security review should be included in the definition of done for every feature.

#### Require Documentation and Handover

Every internship project should produce a handover package containing:

- Project overview
- Architecture diagram
- Database description
- API documentation
- User-role matrix
- Installation instructions
- Environment-variable reference
- Test instructions
- Deployment instructions
- Known limitations
- Future improvement list
- Contact information for responsible maintainers

This prevents knowledge from being lost when the internship ends.

#### Use Version Control and Review Practices

Interns should use feature branches, meaningful commit messages, pull requests, and code reviews. A mentor should review changes for correctness, security, maintainability, and consistency with project standards before they are merged.

#### Evaluate Learning as Well as Output

Internship evaluation should measure both the delivered software and the intern’s professional growth. Evaluation criteria may include:

- Understanding of requirements
- Quality of technical decisions
- Code organization
- Testing discipline
- Security awareness
- Documentation quality
- Communication with stakeholders
- Ability to respond to feedback
- Quality of final presentation and handover

#### Plan for Continuity Between Internships

When multiple interns work on the same system over time, the organization should maintain a backlog of prioritized tasks and a decision log. Each new intern should first review the previous handover, reproduce the development environment, and confirm the current system status before beginning new work.

#### Encourage Responsible Use of AI Tools

AI tools may help interns understand code, generate drafts, and identify possible defects, but all generated work should be reviewed, tested, and understood by the intern. Sensitive data, passwords, payment credentials, national identity information, and private documents must never be shared with unauthorized AI services.

### 21.3 Recommended Long-Term Internship Project Topics

Future interns could extend WeDonate through focused projects such as:

- Secure document access and privacy management
- Complete payment-webhook verification
- Donation distribution and delivery tracking
- Advanced reporting and analytics
- Duplicate-beneficiary and duplicate-support detection
- Mobile or low-bandwidth access for citizens
- SMS and messaging notifications
- Improved Afaan Oromoo and Amharic localization
- Automated database backup and recovery
- Accessibility improvements
- Performance optimization and frontend code splitting
- Automated end-to-end testing
- Monitoring and incident-response dashboards

Each topic should have a limited scope, measurable success criteria, a test plan, and a documented handover requirement.

### 21.4 Expected Benefits

Following these recommendations would help the organization to:

- Protect citizens’ personal and financial information
- Improve trust in donation management
- Reduce administrative errors
- Make the platform easier to maintain
- Preserve knowledge after internships end
- Improve the quality of future software projects
- Give interns realistic professional experience
- Connect academic learning with actual community needs
- Build a sustainable pipeline of documented improvements

The organization should treat internships as a knowledge-transfer and capacity-building program, not only as short-term software-development support.
