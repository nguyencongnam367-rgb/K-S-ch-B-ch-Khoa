# Thu Vien

Basic library website with reader registration, login, and an admin dashboard.

## Setup

1. Install Node.js.
2. Run `npm install`.
3. Optionally copy `.env.example` to `.env`.
4. Run `npm run dev` and open `http://localhost:3000`.

The development admin account is `admin@gmail.com` with password `123456`.
New registrations receive the `user` role. User records are stored in
`src/data/users.json`, and passwords are saved as bcrypt hashes.

The default admin credentials are for local development only. Before
deployment, set a private `JWT_SECRET` of at least 32 characters and an
`ADMIN_PASSWORD` of at least 12 characters in `.env`. Changing the admin
environment password does not overwrite an existing account; remove the local
users data file to create the configured development admin again.
