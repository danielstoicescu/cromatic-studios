# Cromatic Studios — Navigation Mode
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
# SITE_URL is the public address (for social cards, canonical and the sitemap)
ARG SITE_URL=https://drive.cromaticstudios.com
ENV SITE_URL=${SITE_URL}
RUN node build/build.mjs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
USER node
CMD ["node", "server.js"]
