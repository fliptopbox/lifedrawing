var app = (function($) {
	// update copyright year
	$('#year').html(new Date().getFullYear());
	var ascii = function () {
		return [
			"",
			" _ _  __          _                    _",
			"| (_)/ _| ___  __| |_ __ __ ___      _(_)_ __   __ _",
			"| | | |_ / _ \\/ _` | '__/ _` \\ \\ /\\ / / | '_ \\ / _` |",
			"| | |  _|  __/ (_| | | | (_| |\\ V  V /| | | | | (_| |",
			"|_|_|_|  \\___|\\__,_|_|  \\__,_| \\_/\\_/ |_|_| |_|\\__, |",
			"                                                |___/",
			"",
			"",
			].join('\n');
	};
	var romanize = function (num) {
			if (!+num)
					return false;
			var digits = String(+num).split(""),
					key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
								 "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
								 "","I","II","III","IV","V","VI","VII","VIII","IX"],
					roman = "",
					i = 3;
			while (i--)
					roman = (key[+digits.pop() + (i * 10)] || "") + roman;
			return Array(+digits.join("") + 1).join("M") + roman;
	};

	var meta = {
		'title': function (value) {
			$('.description').html(value);
			$('title').html('LIFEDRAWING - ' + value);
		},
		'desc': function (value) {},
		'progress': function (object) {
			var value = object.percent;
			$('#percent').css({
				'width': (Math.min(100, parseInt(value * 100, 10)) + '%')
			});
			if(value >= 1) {
				triggerComplete(object);
				setTimeout(function(){
					$('#percent').css({
						'width': 0
					});
				}, 500);
			}
		},
		'number': function (value) {
			$('.roman').html(romanize(value));
			$('.ctrl-count-current').html(value);
		}
	};

	var doOnComplete = null;
	var triggerComplete = function (object) {
		if (doOnComplete) {
			// console.log('complete', arguments);
			doOnComplete(object);
			doOnComplete = null;
		}
	};
	var renderSvgStream = function (object) {
		var ns = "http://www.w3.org/2000/svg";
		// console.log(object)
		if (!object.type) {
			// reset the progress bar
			// prepare to receive node stream
			// update the roman numeral
			// console.log('STARTING', object);
		}
		if (object.no) {
			window.location.hash = object.no;
			meta.number(object.no);
		}

		// handle the meta data and progress
		if ((/^(title|desc|defs)/gi).test(object.type)) {
			var tag = document.createElementNS(ns, object.type);
			$('svg').append($(tag).html(object.value));
			return meta[object.type] ?
				meta[object.type](object.value) :
				null;
		}
		if (object.percent !== null) {
			// console.log('PROGRESS', (object.percent));
			meta.progress(object);
		}

		// first we need to clear the exisintg SVG
		// and create a new SVG element
		if (object.type === 'svg') {
			var svg = document.createElementNS(ns, "svg");
			$.each(object.attributes, function (key, value) {
				svg.setAttribute(key, value);
			});
			$('#drawing').html($(svg).attr({
				'id': object.id
			}));
		}

		// we need to create each new node
		// and either nest the node OR (Group)
		// append to it's parent (Path)

		if (object.type === 'g') {
			var g = document.createElementNS(ns, "g");
			$.each(object.attributes, function (key, value) {
				g.setAttribute(key, value);
			});

			if($('svg').find('g').length === 0) {
				parent = $('svg');
			} else {
				parent = $('g').last();
			}
			parent.append($(g).attr({
				'class': 'group',
				'id': object.index
			}));
		}

		if (object.type === 'path') {
			var path = document.createElementNS(ns, "path");
			if($('svg').find('g').length === 0) {
				parent = $('svg');
			} else {
				parent = $('g').last();
			}
			$.each(object.attributes, function (key, value) {
				path.setAttribute(key, value);
			});
			parent.append($(path).attr({
				'class': 'path',
				'id': object.index
			}));
		}
	};
	var renderImageList = function (object) {
		// console.log('IMAGELIST', object);
		var array = [],
			data = object.data,
			menu = $('#menu'),
			total = $('#total'),
			template = _.template([
				'<li>',
					'<a href="#<%= no %>" data-no="<%= no %>" id="<%= file %>">',
						'<strong><%= no %></strong>',
						'<em><%= size %>MB</em>',
					'</a>',
				'</li>'
			].join('')),
			keys = Object.keys(object.data);

		keys.forEach(function(value, i) {
			var row = data[value];
			array.push(template({
				file: row.name,
				no: row.no,
				// size: row.size,

				size: Number(row.size / 1024 / 1024).toFixed(2),
			}));
		});
		// console.log(array.join(''));
		menu.html(array.join(''));
		total.html(keys.length);
	};


	var localhost = (/^(local|192|10|172)/i).test(window.location.hostname),
		serverUrl = localhost ? '//' + window.location.hostname + ':5000/' : '//lifedrawing.herokuapp.com/',
		errorCount = 0,
		connection = null;


	var ws = new WebSocket('ws:' + serverUrl);
	ws.onopen = function () {
		// console.log('ws.onopen', arguments);
		// ask for the image list
		ws.send('list');
		// wait for 5 seconds, then get a random image -or- hash value index
		setTimeout(function () {
			var hash = window.location.hash || null;
				value = hash && parseInt((hash).slice(1),10),
				action = (hash && !isNaN(value)) ? 'load' : 'random';

			doOnComplete = function (object) {
				var id = '#' + String(object.id);
				$('.ctrl-elm').css({
					'display': 'inline-block'
				});
				// console.log('ID', id, $(id));
				$(id).addClass('seen current');
			}
			return app.message(action, value);
		}, (5 * 1000));
	};
	ws.onerror = function (error) {
		// an error occurred when sending/receiving data
		errorCount += 1;
		console.log('error', arguments);
	};

	ws.onclose = function () {
		console.log('reconneting attempt failed.', errorCount);
		// var reloadr = confirm('Ooops, I can not connect to server.\n\nOK to reload, or\nCANCEL to abort.');
		// if (reloadr) { window.location.reload(); }
		console.error('socket broken', arguments);
		return;
	};
	ws.onmessage = function (message) {
		// try to decode json (I assume that each message from server is json)
		// console.log(message.data);
		// var path = message.data.decompress();
		// setPath(path);

		var unzip = message.data.decompress(),
			obj = JSON.parse(unzip),
			cmd = obj.cmd;
		switch (cmd) {
			case 'draw':
				renderSvgStream(obj);
				break;
			case 'list':
				renderImageList(obj)
				break;
			default:
				console.warn('unknown command', cmd);
				break;
		}
	};


	/* events */
	$('#drawing').on('click', 'path', function (e) {
		var me = $(this),
			path = me.attr('d').match(/^(?:m)([\d,\.]+)/i)[1].split(','),
			className = me.attr('class') || '',
			hasHover = (/hover/gi).test(className);
		// toggle SVG className
		if (hasHover) {
			className = className.replace(/hover/gi, '');
		} else {
			className += ' hover';
		}
		className = className.replace(/^\s+|\s+$/g, '');
		me.attr('class', className || '');
	});

	$('.menu-list').on('click', 'a', function (e) {
		e.preventDefault();
		app.message('load', this.id);
		$('.menu-list a').removeClass('current');
		$(this).addClass('seen current');
		$('#menu-container').removeClass('open');
	});
	$('#menu-trigger').on('click', function (e) {
		$('#menu-container').toggleClass('open');
	});



	console.log(ascii());
	return {
		socket: ws,
		message: function (key, value) {
			key = key || '';
			value = value || '';
			// console.log('message', arguments);
			ws.send([key, value].join(':'));
		}

	}
}(jQuery));
