FROM node:8.9

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./

RUN npm install
RUN npm run build

# Bundle app source
COPY . .

CMD [ "npm", "start" ]
