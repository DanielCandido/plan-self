FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3010
CMD ["npm", "run", "dev", "-w", "@plan-self/gateway"]
