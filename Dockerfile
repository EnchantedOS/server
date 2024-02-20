FROM node:latest
RUN apt-get update -y && \
    apt-get install default-jdk -y
RUN corepack enable
COPY . ./app
WORKDIR /app
RUN pnpm i
CMD [ "pnpm", "run", "service" ]
