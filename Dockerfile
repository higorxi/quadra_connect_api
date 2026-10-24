FROM node:20-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build && yarn install --frozen-lockfile --production

FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY package.json ./
ENV NODE_ENV=production BACKEND_PORT=3000 AWS_LWA_PORT=3000 AWS_LWA_READINESS_CHECK_PATH=/
# migrations rodam no CI (workflow), não no boot, pra não pesar o cold start
CMD ["node", "dist/src/main"]
