# ShuGhost developer website

Static, dependency-free marketing website for ShuGhost games.

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

Recommended deployment flow:

1. Put the contents of this folder in a GitHub repository.
2. On Railway choose **New Project → Deploy from GitHub repo**.
3. Select the repository and wait for the deployment to succeed.
4. Open **Settings → Networking → Generate Domain**.

Alternatively, install the Railway CLI, sign in, open this folder, and run
`railway up`.

## Publishing

Upload the complete contents of `developer-site` to the hosting provider. The
site is suitable for GitHub Pages, Cloudflare Pages, Netlify, or any ordinary
web host. Connect the chosen ShuGhost domain in the hosting provider's domain
settings after registering it with a domain registrar.

Before enabling Google Ads conversion tracking or analytics, update the privacy
policy and add a consent solution appropriate for the visitor's region.
