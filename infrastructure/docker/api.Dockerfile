FROM node:22-alpine AS dependencies
WORKDIR /app
RUN apk add --no-cache openssl
COPY . .
RUN npm ci
RUN npm run db:generate
RUN npm run build -w @plan-self/config
RUN npm run build -w @plan-self/utils
RUN npm run build -w @plan-self/api
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/dist ./dist
COPY --from=dependencies /app/packages/config/package.json ./packages/config/package.json
COPY --from=dependencies /app/packages/config/dist ./packages/config/dist
COPY --from=dependencies /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=dependencies /app/packages/utils/dist ./packages/utils/dist
COPY --from=dependencies /app/packages/database/package.json ./packages/database/package.json
COPY --from=dependencies /app/packages/database/prisma ./packages/database/prisma
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema packages/database/prisma/schema.prisma && exec node dist/main.js"]
