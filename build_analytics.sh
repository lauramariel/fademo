#!/bin/bash
echo "Build Start"
CWD=$(dirname $0)

# get node version
nodeVersion=$(node -v)
echo $nodeVersion

# Install node packages in dev server
pushd $CWD/demo_setup_file_analytics/web/dev_server
#echo "npm install started....."
#sudo npm install
#echo "npm install ended......."

node app.js

popd

echo "Build done and app started, please access it at localhost:3050/#dashboard?user_name=admin"
