FROM node:14-buster-slim

RUN apt-get update \
&& apt-get install -y autoconf build-essential git tini \
&& apt-get clean

WORKDIR /home/node/app

COPY package.json package.json

RUN npm install && npm cache clean --force && npm prune && npm dedupe

CMD [ "tini", "--", "npm", "run", "dev" ]