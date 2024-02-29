# Use an official Node.js base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY . .

# Expose port 3000 (the port your Express app listens on)
EXPOSE 3000

# Command to run the Node.js application
CMD ["node", "app.js"]