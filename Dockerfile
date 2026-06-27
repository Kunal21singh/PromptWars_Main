# Use official lightweight Node.js image
FROM node:20-slim

# Set working directory inside container
WORKDIR /app

# Copy dependency definition
COPY package.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy remaining code files
COPY . .

# Expose port (Cloud Run sets PORT env variable, defaulting to 8080)
EXPOSE 8080

# Command to execute server
CMD [ "npm", "start" ]
