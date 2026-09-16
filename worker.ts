/**
 * Cloudflare Worker for DJ Mix Visualiser
 * Serves static assets from ./dist and handles edge requests
 */

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Pass request directly to Cloudflare static asset fetcher
    const response = await env.ASSETS.fetch(request);

    // If 404 and not an asset request with extension, fallback to index.html for SPA routing
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexRequest = new Request(new URL('/', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }

    // Add security and performance headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
