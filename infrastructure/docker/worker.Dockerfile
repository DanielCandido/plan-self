FROM node:22-alpine AS dependencies
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w @plan-self/config
RUN npm run build -w @plan-self/worker
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/dist ./dist
COPY --from=dependencies /app/packages/config/package.json ./packages/config/package.json
COPY --from=dependencies /app/packages/config/dist ./packages/config/dist
CMD ["node", "dist/worker.js"]
