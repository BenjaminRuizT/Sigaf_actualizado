FROM node:18-slim

WORKDIR /app

COPY package*.json yarn.lock* ./
RUN npm install --legacy-peer-deps
RUN npm install ajv@^8.0.0 html5-qrcode tesseract.js --legacy-peer-deps

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

RUN npm install -g serve

CMD serve -s build -l $PORT
