/*
	https://github.com/Worlize/WebSocket-Node

	tutorial:
	http://martinsikora.com/nodejs-and-websocket-simple-chat-tutorial
*/
var fs        = require('fs'),
	path      = require('path'),
	util      = require('util'),
	zip       = require('./compress'),
	ws        = require('websocket').server,
	http      = require('http'),
	readline  = require('readline'),
	SVG      = {},
	svgFolder = '../svg/',
	folder = path.join(__dirname, svgFolder),
	connection = null,
	port = Number(process.env.PORT || 5000),
	server = http.createServer(function(request, response) {
		// process HTTP request. Since we're writing just WebSockets server
		// we don't have to implement anything.
		response.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		// console.log('SVG count:', SVG.length);
		response.end(JSON.stringify({
			'port': port,
			'list': SVG
		}));
	}),

	catenatedLine = null,
	lineIndex = 0,

	parseXMLline = function (lineData, lineNo) {

		var text = (catenatedLine || '') + (lineData || ''),
			type = (text).match(/^<([^\s\>]*)[ |>]/i),
			pairs = (text).match(/\s([^=]+="[^""]+")/g),
			isClosed = (/(<\/[^>]+>| ?\/>)$/g).test(text),
			isOrphan = (/^<\/[^\v]+>$/).test(text),
			isIgnore = (/^<(\?xml|!doctype)/i).test(text),
			isComment = (/^<!--/).test(text),
			isContd = (/^(?!\<)/).test(text),
			isBlank = !lineData || (/^$/).test(text),
			isReady = (/>$/).test(text),
			skip = (isOrphan || isIgnore || isComment || isBlank),
			bypassAttr = new RegExp('^(id|sketch)', 'gi'),
			value = null,
			atts = {},
			obj = {};


		if(skip) {
			catenatedLine = null;
			return null;
		}

		// accumulate text of partial lines until the XML tag is fully formed.
		// this means the line must have an open and close bracket, and optional innerHTML value
		if (!isReady) {
			// console.log('CATENATE %s', lineNo);
			catenatedLine = text;
			return null;
		}

		// Parse the correclty formatted XML tag.
		// attribute pairs
		if(pairs) {
			pairs.forEach(function(pair, n) {
				var array = pair.split('='),
					key = String(array[0]).trim(),
					value = String(array[1]).trim().replace(/^"|"$/g, '');

				//console.log('[%s]', key, bypassAttr, bypassAttr.test(key));

				if(bypassAttr.test(key)) { return; }
				atts[key] = value;
			});
		}

		// innerHTML value
		if(isClosed) {
			value = text.match(/>([^\<]*)<\//);
			value = value && value[1] || null;
		}

		// Integrity check
		if(!type) {
			return {
				no: 1,
				description: 'no defined type',
				data: catenatedLine
			};
		}

		// format return Object
		obj.index = lineIndex;
		obj.line = lineNo;
		obj.type = type[1];
		obj.value = value;
		obj.bytes = (text || '').length;
		obj.attributes = atts;

		lineIndex += 1;
		catenatedLine = null;
		return obj;
	},


	getTextStream = function (path, size, callback) {
		var rd = readline.createInterface({
		      input: fs.createReadStream(path),
		      output: process.stdout,
		      terminal: false
		    }),
			cat = '',
			i = 0,
			total = 0,
			parse = null,
			text = null;

		// reset the line cache, and line index
		lineIndex = 0;
		catenatedLine = null;

		// console.log(path, size);
		rd.on('line', function(line) {
			text = line.trim() || '';
			parse = parseXMLline(text, (i ++));

			if (parse) {
				total += parse.bytes;
				parse.total = total;
				parse.percent = (total / size);
				return callback(null, parse);
			}

			return callback(parse, null);
		});

		rd.on('close', function() {
		  //process.exit(0);
		  console.log('EOF.', arguments);
		  return callback(null, null, true);
		});
	},

	sendCompressedMsg = function (object) {
		var text = JSON.stringify(object),
			zip = text.compress();
		// console.log('ZIPPED before:%s after:%s saving:%s%',
		// 	text.length, zip.length,
		// 	parseInt((zip.length/text.length) * 100, 10));
		return connection.sendUTF(zip);
	};

// populate the SVG array with file data

fs.readdir(folder, function (err, files) {
	if (err) { throw err; }

	files
		.filter(function (file) {
			return (/^\w[^\.]+\.svg$/i).test(file);
		})
		.forEach(function(file, i) {
			SVG[file] = {
				name: file,
				size: fs.statSync(path.join(folder, file)).size,
				index: i,
				no: (i + 1),
			};
		});
});

server.listen(port, function() {
	console.log((new Date()) + " Server is listening on port " + port);
});

// create the websocket server
wsServer = new ws({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
	connection = request.accept(null, request.origin);

	// This is the most important callback for us, we'll handle
	// all messages from users here.
	connection.on('message', function(message) {
		/*
			Anatomy of the @messgae:
			String 'key:value'
			eg: 'load:Sketch165.svg'
		*/
		var cmd = message.utf8Data,
			action = cmd.split(':') || [null, null],
			key = action[0], // eg. list
			value = action[1], // 'Sketch165.svg' -or- 10
			filename = null,
			filePath = null,
			fileNumber = null,
			svgKeys = Object.keys(SVG),
			svgObject = null,
			randomInt = Math.ceil(Math.random() * (svgKeys.length - 1));

		// convert to Number if possible so that app.message('load', 10) gets the SVG[10]
		value = /^[0-9]+$/g.test(value) ? Math.max(0, parseInt(value, 10) -1) : value;

		switch (key) {
			case 'list':
				sendCompressedMsg(({
					cmd: 'list',
					data: SVG,
					timestamp: new Date().valueOf()
				}));
				break;

			case 'load':
			case 'random':
				if(key === 'random') {
					value = svgKeys[randomInt];
				}
				if(key === 'load' && typeof value === 'number' && svgKeys[value]) {
					value = svgKeys[value];
				}

				console.log('MESSAGE:', key, value, SVG[value]);

				svgObject = SVG[value] ? SVG[value] : SVG[svgKeys[0]];
				filename = svgObject.name,
				fileNumber = svgObject.no;
				filePath = path.join(__dirname, svgFolder, filename);

				fs.stat(filePath, function (err, stats) {
					if(err) { return false; }
					// send back the basic file data, for the progress bar
					sendCompressedMsg({
						id: filename,
						cmd: 'draw',
						no: fileNumber,
						size: stats.size,
						percent: 0,
						timestamp: new Date().valueOf()
					});
					// stream the XML nodes to the client
					getTextStream(filePath, stats.size, function (err, object, eof) {
						if(err) {
							console.log('DUMP', filePath, stats.size);
							return null;
						}
						if(object) {
							object.cmd = 'draw';
							return sendCompressedMsg(object);
						}
						if(eof) {
							return sendCompressedMsg({
								id: filename,
								cmd: 'draw',
								percent: 1,
								timestamp: new Date().valueOf()
							});
						}
					});
				});
				break;

			default:
				console.log('Unknown command', key, value);
				break;
		};
	});

	connection.on('close', function(connection) {
		// close user connection
		console.log('connection.close');
		// connection.close();
		// connection = request.accept(null, request.origin);
	});
});

