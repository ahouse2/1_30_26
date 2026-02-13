# Dockerfile for the frontend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache curl
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
