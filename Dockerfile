# Web app dev image: Next.js dev server with hot reload. The worker's
# Dockerfile is Unit 07's; this one is only for the web service in compose.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
