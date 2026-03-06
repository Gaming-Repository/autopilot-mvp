# Build stage
FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM node:22-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/public ./client/public

# Hugging Face Spaces expects port 7860
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["pnpm", "run", "start"]
