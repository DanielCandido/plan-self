FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3002
CMD ["npm", "run", "dev", "-w", "@plan-self/setup-wizard"]
