# app container
FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY src/app/package.json /usr/src/app/
COPY src/app/. /usr/src/app/
RUN npm install

# CMD npm start // for dev
