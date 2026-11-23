
# -----------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------
FROM node:24-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci


# -----------------------------------------------
# Stage 2: Build NestJS application
# -----------------------------------------------
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


# -----------------------------------------------
# Stage 3: Production image
# -----------------------------------------------
FROM node:24-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
