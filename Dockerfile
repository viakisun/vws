# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --no-frozen-lockfile --prod

# Copy built application
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["node", "build/index.js"]
