# Stage 1: Build dependencies
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Stage 2: Run with distroless
FROM gcr.io/distroless/nodejs18
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 5001
CMD ["server.js"]