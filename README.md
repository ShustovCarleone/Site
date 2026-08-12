# ShuGhost developer website

Dependency-free Node.js marketing website for ShuGhost games.

## Preview locally

Run the same Node.js server that Railway will use:

```powershell
npm start
```

Then open `http://localhost:3000`.

## Railway

The project is ready for Railway: `package.json` contains the `npm start`
command, `server.mjs` listens on `0.0.0.0` and Railway's `PORT`, and
`railway.json` configures the health check.

The production server also includes basic API rate limiting, request-size and
timeout limits, security headers, graceful shutdown handling, and a dedicated
`/health` endpoint used by Railway. Railway is configured to restart a failed
process up to 10 times.

Recommended deployment flow:

1. Put the contents of this folder in a GitHub repository.
2. On Railway choose **New Project → Deploy from GitHub repo**.
3. Select the repository and wait for the deployment to succeed.
4. Open **Settings → Networking → Generate Domain**.
5. To preserve the total visitor count across deployments, add a Railway
   **Volume** to the service and mount it at `/data`.

Alternatively, install the Railway CLI, sign in, open this folder, and run
`railway up`.

## Publishing

Upload the complete contents of `developer-site` to the hosting provider.
Because the visible visitor counter uses the `/api/visitor-heartbeat` endpoint,
the site must run through `server.mjs`; a static-only host will not provide the
counter. Connect the chosen ShuGhost domain in the hosting provider's domain
settings after registering it with a domain registrar.

Google Ads tag `AW-18379981521` is installed with Consent Mode v2. Advertising
and analytics storage are denied until a visitor accepts them in the site's
cookie banner.

## Contact

The site displays `shustovxd15032112@gmail.com` as a direct `mailto:` contact.
It does not store contact messages or require any email-related Railway
variables.
