# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the static SPA with pnpm.
# ---------------------------------------------------------------------------
FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable

# Install dependencies first (cached unless the manifests change). The
# pnpm-workspace.yaml carries `allowBuilds: esbuild: true` so esbuild's binary
# is set up non-interactively; .npmrc disables the run-time deps check.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build (tsc typecheck + vite build) -> /app/dist
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 2 — serve the static files with nginx. No app server, no backend:
# this is a purely static, in-browser tool.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
