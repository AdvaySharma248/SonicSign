# SonicSign Backend

Express and MongoDB API for SonicSign, a document signing SaaS workflow.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default.

## Main API areas

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/documents/upload`
- `GET /api/documents`
- `POST /api/signers`
- `POST /api/signers/send-invite`
- `POST /api/signatures`
- `POST /api/signatures/finalize`
- `GET /api/public/sign/:token`
- `POST /api/public/sign/:token`
- `GET /api/audit/:documentId`
- `GET /api/dashboard/summary`

Controllers stay thin, services own workflow decisions, and repositories isolate Mongoose queries.
