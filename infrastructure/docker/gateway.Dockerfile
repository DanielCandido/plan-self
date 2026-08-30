FROM node:22-alpine AS dependencies
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w @plan-self/config
RUN npm run build -w @plan-self/gateway
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/dist ./dist
COPY --from=dependencies /app/packages/config/package.json ./packages/config/package.json
COPY --from=dependencies /app/packages/config/dist ./packages/config/dist
EXPOSE 3010
CMD ["node", "dist/main.js"]
