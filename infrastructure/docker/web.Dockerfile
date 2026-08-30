FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w @plan-self/types
RUN npm run build -w @plan-self/sdk
RUN npm run build -w @plan-self/ui
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @plan-self/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
