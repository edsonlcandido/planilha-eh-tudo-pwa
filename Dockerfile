# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Build vite
CMD [ "npm", "run", "build" ]

# Preview vite
CMD [ "npm", "run", "preview", "--host" ]
