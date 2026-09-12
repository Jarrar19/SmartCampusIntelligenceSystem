FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including dev for TypeScript compilation
RUN npm install

# Copy rest of application code
COPY . .

# Generate Prisma client and build typescript
RUN npx prisma generate
RUN npm run build

# Ensure storage directory exists
RUN mkdir -p storage/resources storage/assignments storage/marketplace storage/avatars storage/general

EXPOSE 5000

# Sync database, run seed, and start
CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && npm start"]
