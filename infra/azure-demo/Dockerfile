FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@11.19.0
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npm run browser:install
ENV NODE_ENV=production
RUN chown -R node:node /app/.next
USER node
RUN npm run browser:check
EXPOSE 3000
CMD ["node", "--import", "tsx", "scripts/demo-server.ts"]
