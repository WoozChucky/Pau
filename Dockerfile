FROM node:8
#EXPOSE 8080

ENV NODE_ENV=production

WORKDIR /home/node/app

ADD package.json .
RUN npm install

COPY ./dist .

CMD ["node","app.js"]
