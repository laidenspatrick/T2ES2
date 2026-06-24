FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REPORT_SERVICE_URL=http://localhost:3005/api/v1
ENV VITE_REPORT_SERVICE_URL=$VITE_REPORT_SERVICE_URL
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3105
CMD ["nginx", "-g", "daemon off;"]
