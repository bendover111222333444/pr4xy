FROM node:18-alpine
ENV NODE_ENV=production
ARG NPM_BUILD="npm install --omit=dev"
EXPOSE 8080/tcp
LABEL maintainer="Mercury Workshop"
LABEL summary="Scramjet Demo Image"
LABEL description="Example application of Scramjet"
WORKDIR /app
COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN apk add --upgrade --no-cache python3 py3-pip make g++
RUN npm install -g pnpm && pnpm install --prod
RUN pip install wisp-python --break-system-packages
COPY . .
ENTRYPOINT [ "bash" ]
CMD ["start.sh"]
