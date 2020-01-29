/*
	https://github.com/Worlize/WebSocket-Node

	tutorial:
	http://martinsikora.com/nodejs-and-websocket-simple-chat-tutorial
*/
var fs        = require('fs'),
	path      = require('path'),
	util      = require('util'),
	XmlStream = require('./lib/xml-stream'),
	zip = require('./lib/compress'),
	WebSocketServer = require('websocket').server,
	http = require('http'),
	svgs = [],
	// dir = fs.readdirSync('./svg/'),

	connection,
	port = Number(process.env.PORT || 5000),
	server = http.createServer(function(request, response) {
		// process HTTP request. Since we're writing just WebSockets server
		// we don't have to implement anything.
		response.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		// create a list of all SVG files
		/*svgs = [];
		dir.forEach(function (a, b) {
			var isSvg = (/\.svg$/i).test(a);
			if(isSvg) {
				fs.stat(path.join(__dirname, 'svg/', a), function (err, stats) {
					console.log(a, stats.size);
					svgs.push([a, stats.size]);
				});
			}
		});*/
		/*
			fs.stat(fpath, function (err, stats) {
				// console.log(err, util.inspect(stats));
				if(err) {
					return false;
				}
				getXMLstream(fpath, stats.size);
			});
		*/
		console.log('SVG count:', svgs.length);
		response.end(JSON.stringify({
			'port': port,
			'list': svgs
		}));
	}),
	getXMLstream = function (path, size) {
		var stream = fs.createReadStream(path);
		var xml = new XmlStream(stream);
		var pathcount = 0;
		var lenCount = 0;



		//xml.preserve('path', true);
		xml.collect('path');

		connection.sendUTF('START');
		connection.sendUTF('SIZE::' + size);

		console.log('on.start', path);

		xml.on('endElement: svg > title', function (item) {
			console.log('text', item);
			connection.sendUTF('TITLE::' + item.$text);
		});

		xml.on('endElement: svg > desc', function (item) {
			console.log('desc', item);
			connection.sendUTF('DESC::' + item.$text);
		});

		xml.on('endElement: path', function(item) {
			// var rx = item.$.d.replace(/\s+/g, '');
			var rx = item.$.d,
				len = rx.length,
				zip = rx.compress(),
				zlen = zip.length;
			// console.log('len', len, 'zlen', zlen, parseInt((len/zlen) * 100, 10));
			// connection.sendUTF(rx);
			lenCount += len;
			pathcount += 1;
			connection.sendUTF('PROGRESS::' + parseInt((lenCount/size).toPrecision(2) * 100, 10));
			connection.sendUTF(zip);
		});



		xml.on('end', function () {
			console.log('on.end', path, pathcount);
			connection.sendUTF('END');
			stream = null;
			xml = null;
			pathcount = 0;
		});
	};

// populate the SCG array with file data
var folder = './svg/';
fs.readdir(folder, function (err, files) {
	if (err) { throw err; }

	files.filter(function (file) {
		return (/\.svg$/i).test(file);
	}).forEach(function(file) {
		svgs.push([file, fs.statSync(path.join(folder, file)).size]);
	});
});

server.listen(port, function() {
	console.log((new Date()) + " Server is listening on port " + port);
});
// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
	connection = request.accept(null, request.origin);

	// This is the most important callback for us, we'll handle
	// all messages from users here.
	connection.on('message', function(message) {
		// if (message.type === 'utf8') {
			// process WebSocket message
			var filename = message.utf8Data || 'Sketch82.svg',
				fpath = path.join(__dirname, 'svg/', filename);
			// Create a file stream and pass it to XmlStream
			fs.stat(fpath, function (err, stats) {
				// console.log(err, util.inspect(stats));
				if(err) {
					return false;
				}
				getXMLstream(fpath, stats.size);
			});


		// }
	});

	connection.on('close', function(connection) {
		// close user connection
		console.log('connection.close');
		// connection.close();
		// connection = request.accept(null, request.origin);
	});
});

