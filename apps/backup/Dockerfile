FROM node:26.12.1-alpine
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
RUN apk add --no-cache postgresql16-client rclone tzdata tar
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN mkdir -p /backups && chown -R node:node /backups /app
USER node
VOLUME /backups
EXPOSE 8081
CMD ["node", "src/backup.mjs", "daemon"]
