FROM node:20-slim

ENV TZ=Asia/Ulaanbaatar

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

ARG MODE
ENV MODE=$MODE

CMD npm run "$MODE"
