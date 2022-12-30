FROM node:10.14.0

RUN apt-get update && apt-get install docker -y

RUN npm install -g bower

RUN mkdir /src
WORKDIR /src

ADD package.json /src
ADD yarn.lock /src
ADD bower.json /src

RUN yarn install --ignore-engines
RUN bower install


