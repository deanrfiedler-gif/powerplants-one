FROM node:24.20.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@11.19.0
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npx playwright install --with-deps chromium
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
# Copy browser executables to a non-root-readable location; no runtime credentials in the image.
RUN cp -a /root/.cache/ms-playwright /opt/ppo-browsers && chmod -R a+rX /opt/ppo-browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ppo-browsers
RUN chown -R node:node /app/.next
USER node
EXPOSE 3000
CMD ["node", "--import", "tsx", "scripts/demo-server.ts"]
