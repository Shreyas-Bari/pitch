# PITCH — Technical Finalization (Final)

## Architecture
```text
React + Vite
  -> HTTPS
Express + Node.js
  -> MongoDB Atlas
  -> Cloudinary/external storage
  -> PDF + SHA-256
  -> Socket.IO
```

Backend domains: Auth/RBAC, Profiles, Events/Packages, Applications/Invitations, Search/Matching, Chat, Proposals/Deals, MoU/Signatures, Fulfillment, Reviews, Notifications, Admin/Audit/Disputes.

## Repository
```text
PITCH/
├── frontend/
├── backend/
├── docs/
├── .gitignore
└── README.md
```

## Frontend stack
React, Vite, React Router, Tailwind CSS, shadcn/ui, Axios, React Hook Form, Zod, Recharts, Socket.IO Client, Lucide React.

## Backend stack
Node.js, Express, Mongoose, JWT, bcrypt/bcryptjs, Multer, Socket.IO, PDF generation and SHA-256.

## Security
- Short-lived access JWT.
- Secure HttpOnly refresh cookie.
- Refresh rotation/session handling.
- RBAC and ownership checks.
- Rate limiting.
- Password security invalidation.
- Frontend never receives refresh-token secret.
- Backend is the final authority.
- No secrets in frontend bundle.

## Frontend architecture
- Central API client.
- Central auth/session state.
- Protected and role-aware routes.
- Reusable components and hooks.
- Server data remains server-authoritative.
- Loading, empty, error and unauthorized states are required.
- No duplicated API clients.
- No hard-coded production/local API URLs inside components.

## Realtime
Socket.IO supplements REST persistence. Conversation rooms require server authorization. Frontend must handle reconnect and stale connection states.

## Files
Use upload APIs and external storage. Validate file type/size and show upload/error states. Never assume local filesystem paths.

## Environment
Frontend environment contains only public-safe configuration such as API/backend URLs. Never expose MongoDB, Cloudinary private credentials or JWT secrets.

## Deployment target
- Vercel: frontend
- Render: backend
- MongoDB Atlas: database
- Cloudinary: file storage

Phase 31 is complete only after actual production deployment and frontend/backend/database/storage/Socket.IO smoke and E2E verification.

## Non-goals
Do not add payment gateway, escrow, wallet, WhatsApp API, certified e-signature, AI-generated legal clauses, identity-verification claims or unrelated roles/features.

## Frontend order
1. Foundation/design system/auth/API.
2. Public marketplace.
3. Company and committee dashboards.
4. Communication/chat/notifications.
5. Deal/proposal/MoU/signing/fulfillment/reviews.
6. Admin.
7. Integration, responsive/accessibility QA and E2E.
