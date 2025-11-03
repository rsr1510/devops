# Use the official Nginx base image
FROM nginx:alpine

# Copy the HTML file into Nginx's default html directory
COPY index.html /usr/share/nginx/html/index.html

# Expose port 80 for web traffic
EXPOSE 80

# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
