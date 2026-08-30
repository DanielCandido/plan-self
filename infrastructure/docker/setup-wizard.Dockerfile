FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w @plan-self/setup-wizard

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=builder /app/apps/setup-wizard/.next/standalone ./
COPY --from=builder /app/apps/setup-wizard/.next/static ./apps/setup-wizard/.next/static
EXPOSE 3002
CMD ["node", "apps/setup-wizard/server.js"]
