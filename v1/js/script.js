$(function(){
	var date = function(d,m,yy) {
			yy = 2000 + yy;
			var s = (new Date(yy, m - 1, d)).toString().split(' ').slice(0,4),
				r = s[0] + ' ' + s[2] + ' ' + s[1] + ' ' + s[3];
			console.log(r);
			return r;
		},
		files = [
			['Sketch80.svg', 'Standing with frames behind', date(11,9, 13)],
			['Sketch82.svg', 'The scribbled thinker', date(11,9, 13)],
			['Sketch84.svg', 'Study of a man\'s groin', date(11,9, 13)],
			['Sketch94.svg', 'Foreshortened prayer pose', date(9,10, 13)],
			['Sketch97.svg', 'Lovely curves asleep', date(9,10, 13)],
			['Sketch98.svg', 'Five minute portrait study', date(16,10, 13)],
			['Sketch103.svg', 'Chin in hand, short pose', date(16,10, 13)],
			['Sketch106.svg', 'Relaxing on the sheet', date(16,10, 13)],
			['Sketch115.svg', 'Profile of scratched man', date(23,10, 13)],
			['Sketch119.svg', 'Halloween standing profile', date(28,10, 13)],
			['Sketch120.svg', 'The Halloween whore and the crow', date(28,10, 13)],
			['Sketch124.svg', 'The lady of leisure in her corset', date(15,1, 13)],
			['Sketch136.svg', 'Foreshortened old man', date(6,11, 13)],
			['Sketch147.svg', 'Sleeping woman from above', date(6,11, 13)],
			['Sketch148.svg', 'Close-up fast asleep', date(13,11, 13)],
			['Sketch150.svg', 'Five minute profile study', date(15,1, 14)],
			// ['Sketch158.svg', 'Reclining with a twisted torso', date(15,1, 14)],
			['Sketch159.svg', 'Relaxed long pose in contours', date(15,1, 14)],
			['Sketch165.svg', 'Portrait, one minute pose', date(29,1, 14)],
			['Sketch166.svg', 'Close-up portrait, one minute pose', date(29,1, 14)],
			['Sketch169.svg', 'Full body pregnant pose five minutes', date(29,1, 14)],
			['Sketch170.svg', 'Pregnant young woman', date(29,1, 14)],
			['Sketch172.svg', 'Seated asleep long pose', date(29,1, 14)],
			['Sketch172a.svg', 'Seated asleep (detail)', date(29,1, 14)]
		],
		hash = parseInt(window.location.hash.replace(/([^0-9]+)/, ''), 10) || null,
		current = hash || null;
		canvas = $('#canvas'),
		dots = $('#dots'),
		description = $('#description'),
		navigation = $('#navigation'),
		loading = $('#loading'),
		title = function (array) {
			$('title').html('Life drawing: ' + array[2]);
		},
		loader = function () {
			loading.show();
			description.hide();
			return function () {
				loading.hide();
				description.show();
			}
		},
		svg = function (index) {
			var max = files.length - 1;
			index = typeof index === 'number' ? index : Math.floor(Math.random() * max);
			index = index > max ? 0 : index;
			index = index < 0 ? max : index;

			var unload = loader();
			current = index;
			// console.log(files[index][0]);
			window.location.hash = index;
			$.get(files[index][0], function(d) {
				$('.dot').removeClass('selected');
				$('#dot_' + index).addClass('selected');
				var root = document.importNode(d.documentElement,true);
				root.id = index;
				canvas.html(root);
				description.html(files[index][1]);
				title(files[index]);
				unload();
			}, 'xml');

		};

	dots.append(function () {
		var html = [];
		$.each(files, function (i, array) {
			html.push('<a href="#' + i + '" data-n="' + i + '" data-alt="' + array[1] + '" class="dot" id="dot_'+ i +'">' + i + '</a>');
		});
		return html.join('');
	});

	navigation.on('click', 'a', function (e) {
		e.preventDefault();
		var me = $(e.target),
			verb = me.attr('href') || me.parent().attr('href'),
			n = me.data('n'),
			id = n && parseInt(String(n).replace(/[^0-9]*/, ''), 10),
			action = {
				'#next': (current + 1),
				'#previous': (current - 1)
			};
		// console.log(verb, n, id);
		svg( typeof id === 'number' ? id : action[verb]);
	});


	svg(hash);
});