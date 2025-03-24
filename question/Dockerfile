FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY ./src ./src

EXPOSE 3002
CMD ["npm", "start"]
