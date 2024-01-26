FROM node:18.16.1-bookworm-slim as build

WORKDIR /app

RUN apt update -y && apt install -y git

COPY package.json yarn.lock ./

RUN yarn install --prod

COPY . .

RUN yarn run build

FROM node:18.16.1-bookworm-slim

USER node

WORKDIR /home/node

COPY --chown=node:node --from=build /app/config ./config

COPY --chown=node:node --from=build /app/node_modules ./node_modules

COPY --chown=node:node --from=build /app/dist ./dist

ENV NODE_ENV production

CMD [ "node", "dist/main.js" ]
