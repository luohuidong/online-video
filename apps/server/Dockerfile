FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/package.json
RUN bun install --frozen-lockfile --filter './apps/server' --omit=dev

COPY apps/server ./apps/server
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["bun", "run", "start"]
