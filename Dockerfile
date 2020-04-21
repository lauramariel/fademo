#Using Debian 9 (LTS) with Node 10.17
FROM node:10.17-stretch-slim

#Set the working directory for all future commands
WORKDIR /app/

COPY . .

#Listens on port 80
EXPOSE 3050

# runs build_analytics.sh
CMD ["/bin/bash","-c","./build_analytics.sh"]
