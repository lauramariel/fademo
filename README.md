This is a slightly modified version of the File Analytics laptop demo: https://drive.google.com/file/d/1432OA1yxkWVv2kzzwDfxagY2MO2q1jLu/view?usp=sharing

The bootstrap file is called build_analytics.sh which runs `node app.js`

Currently, to enable WalkMe/Intercom we are using a copy of devanalytics.js and prodanalytics.js and making the choice which one to run in the script itself which is embedded in index.html (demo_setup_file_analytics/web/index.html). Fullstory and Adobe Analytics isn't yet included.
