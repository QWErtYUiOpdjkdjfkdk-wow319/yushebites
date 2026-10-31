// Comma-separated list of allowed sites, e.g.
// CLIENT_ORIGINS=https://yushebites-admin.netlify.app,https://yushebites-order.netlify.app
// If not set (local development), every origin is allowed.
export const allowedOrigins = process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : '*';
