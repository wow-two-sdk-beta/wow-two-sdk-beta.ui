// @wow-two-beta/ui/auth — headless session client over the wow-two backend identity baseline.
// `AuthProvider` owns the session state machine (unknown → resolving → authenticated | anonymous):
// me-resolve on mount (StrictMode-deduped), signIn / signOut / refresh / setUser actions, generic
// `TUser` typing. `createAuthBridge` is the module-scope hub for the non-React seams — feed
// `bridge.onUnauthorized` to `createApiClient` so a 401 flips the session, and
// `bridge.isAuthenticated` to the router's `requireAuth(...)` guard so protected routes await the
// resolve before redirecting. Strategies cover the three evidenced product shapes: cookie
// me-resolve (drydock, smart-qr incl. guest/`isAnonymous`), in-memory bearer (secrets-vault —
// `getAuthToken` feeds `createApiClient`), and external OAuth redirect (drydock sign-in). This
// subpath carries NO peer dependency (plain React + `foundation/http` types) and NO UI — gates,
// splash screens, and login pages stay app-side.

// Session model + provider
export { AuthStatus, type AuthSession, type AuthResolveContext, type AuthStrategy } from './AuthSession';
export { AuthProvider, useAuth, type AuthProviderProps, type AuthApi } from './AuthProvider';

// Non-React seams — api-client 401s in, router-guard reads out
export { createAuthBridge, type AuthBridge, type UnauthorizedListener, type SessionListener } from './AuthBridge';

// Strategies
export { createCookieStrategy, type CreateCookieStrategyOptions, type CookieAuthClient, type CookieSignInContext } from './CookieStrategy';
export { createBearerStrategy, type CreateBearerStrategyOptions, type BearerStrategy, type BearerAuthenticateResult } from './BearerStrategy';
export { createRedirectStrategy, type CreateRedirectStrategyOptions } from './RedirectStrategy';
export { createMemoryTokenStorage, type TokenStorage } from './TokenStorage';
