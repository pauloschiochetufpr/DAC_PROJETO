FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN apk add --no-cache curl

EXPOSE 3000
CMD ["node", "server.js"]
