# PITCH — Where Brands Meet Campus Communities

PITCH is a two-sided sponsorship marketplace connecting **college committees** with **companies and brands**. Committees create events and publish sponsorship opportunities; companies discover, apply, negotiate, and close deals — all within a structured, transparent platform.

## Tech Stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Frontend | React, Vite, React Router, Tailwind CSS, shadcn/ui, Recharts |
| Backend  | Node.js, Express, Mongoose, JWT, Socket.IO                   |
| Database | MongoDB Atlas                                                 |
| Storage  | Cloudinary                                                    |

## Repository Structure

```
PITCH/
├── frontend/   # React + Vite client application
├── backend/    # Express REST API + WebSocket server
├── docs/       # Product specification & architecture docs
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas cluster (or local MongoDB instance)
- Cloudinary account

### Backend Setup

```bash
cd backend
cp .env.example .env        # fill in your credentials
npm install
npm run dev
```

The API server starts at `http://localhost:5000` by default.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` by default.

## Documentation

- [Product Specification](docs/product-spec.md)

## License

This project is for academic/educational purposes.
