FROM node:18.16.1-bookworm-slim as build

WORKDIR /app

# Install git if your build requires it, else you can remove this line
RUN apt update -y && apt install -y git

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install all dependencies, including devDependencies
RUN yarn install

# Copy the rest of your source code
COPY . .

# Build the project
RUN yarn run build

# Remove devDependencies
RUN yarn install --prod --ignore-scripts --prefer-offline

FROM node:18.16.1-bookworm-slim

USER node

WORKDIR /home/node

# Copy necessary files from the build stage
COPY --chown=node:node --from=build /app/config ./config
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

ENV NODE_ENV production

CMD [ "node", "dist/main.js" ]
