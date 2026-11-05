# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npx ng build --configuration production

FROM nginx:1.27-alpine AS runtime

# O nginx oficial aplica envsubst em /etc/nginx/templates/*.template na inicialização.
# BACKEND_URL define para onde /api é encaminhado (ex.: https://meu-backend.azurewebsites.net).
ENV BACKEND_URL=http://backend:8080

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
