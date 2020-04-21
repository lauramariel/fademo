// Load node.js package libraries.
var https = require('http'),
	express = require('express'),
	httpProxy = require('http-proxy'),
	url = require('url'),
	path = require('path');

var apiProxy = httpProxy.createProxyServer();

// Load local modules
var resources = require('./resources');

// set global variables
var log = console.log.bind(console);

// Load external configuration.
var env = require(path.join(__dirname, 'local_config')).app;

// Initialize directory variables.
log('path.resolve() = ', path.resolve());
log('path.resolve() = ', path.normalize(path.resolve() + '/../app/'));
log('path.resolve() = ', path.normalize(path.resolve() + '/../'));
var fullPath = path.normalize(path.resolve() + '/../'),
    nutanix_dev_dir = fullPath;

// Load and configure express.
var app = express();
app.set('port', process.env.PORT || env.listenerPort);

resources.setupResources(env, app, nutanix_dev_dir);

var server = https.createServer(env.options, app);

// VM Hot scale up, status read using node api - mainly used for Prod
var fs = require('fs');
app.get('/fa_gateway/update_status', function(req, res) {
  fs.readFile(env.memory_change, 'utf8', function(err, data) {
    var result = 'An Error Occured';
    if (!err && data && JSON.parse(data).length) {
      result = JSON.stringify(JSON.parse(data)[JSON.parse(data).length - 1]);
    }
    res.end(result);
  });
});

if (env.mockData) {
  require('./mock.js')(app);
}


app.all("/fa_gateway/*", function(req, res) {
  req.url = req.url.replace('/fa_gateway', '');
  var requestUrl = 'https://' + req.headers.host;
  var port = process.env.PORT || env.listenerPort;
  var apiServer = requestUrl.replace(':'+port,'');
  apiProxy.web(req, res, { target: apiServer, secure: false },
    function(e) {
      log('Node Server Crashed...', e);
    });
});
server.listen(app.get('port'), function(req, res) {
	log('Server Started');
});
