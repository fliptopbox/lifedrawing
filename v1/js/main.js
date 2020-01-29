var app = (function ($) {

  var NS = "http://www.w3.org/2000/svg",
    // serverUrl = '//lifedrawing.herokuapp.com/',
    localhost = (/localhost/i).test(window.location.origin),
    serverUrl = localhost ? '//localhost:5000/' : '//lifedrawing.herokuapp.com/',
    canvas = document.getElementById('canvas');
    progress = $('#progress'),
    title = $('title'),
    svg = null,
    list = null;

  /*
    SVG root attributes:
    --------------------
    version="1.1",
    id="1",
    x="0px",
    y="0px",
    width="2970px",
    height="2100px",
    viewBox="0 0 2970 2100",
    enable-background="new 0 0 2970 2100",
    xml:space="preserve"
  */
  var version = '1.1',
    uid = '',
    x = '0px',
    y = '0px',
    width =  1280,
    height =  720,
    viewBox = '0 0 ' + width + ' ' + height,
    enablebackground = 'new 0 0 ' + width + ' ' + height,
    xmlspace = 'preserve',
    transform = 'matrix(1,0,0,1,' + width + ',' + height + ')',

    auto = false,
    deleteDurationMs = 2000,
    current = null,
    description,
    i = 0,
    q = 0, group, delay = 2,
    getProgress = function (n) {
      progress.css({'width': n + '%'});
      if(n <= 5) { progress.show(250); }
      if(n >= 100) { progress.delay(550).fadeOut(250); }
    },
    romanize = function (num) {
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
    },
    setPath = function (text) {
      var meta, value;
      if((/^[A-Z]+::/).test(text)) {
        meta = text.replace(/::(.*)$/, '');
        value = text.replace(/^[A-Z]+::/, '');
        //console.log('META:', meta, value);
        if (meta === 'PROGRESS') {
          getProgress(value);
        }
        if (meta === 'TITLE') {
          description = value;
        }
        return;
      }

      if(text === 'END') {
        //console.log('done', q, i);
        // enable the NEXT button
        $('.filedescription').html(description || '');
        getProgress(100);
        setTimeout(function() {
          app.toggleNextButton(true);
        }, q);

        if(deleteExisting) {
          deleteExisting();
          deleteExisting = null;
        }
        if(auto) {
          setTimeout(function() {
            app.next();
          }, q + 2500);
        }
        q = 0;
        i = 0;
        return;
      }
      if(text === 'START') {
        // disable the NEXT button.
        app.toggleNextButton(false);
        return;
      }

      setTimeout(function() {
        var SVGObj=document.createElementNS(NS, "path");
        SVGObj.setAttribute("d", text);
        group.appendChild(SVGObj);
        //console.log(uid);
        if(count > 1 && deleteExisting) {
          deleteExisting();
          deleteExisting = null;
        }
        count += 1;
        // //console.log(i, n, (i/n) * 100);
      }, q += delay);
    },
    deleteNode = function (id) {
      $('#' + id).remove();
    },
    deleteExisting = null,
    count = 0,
    errorCount = 0;






  // if user is running mozilla then use it's built-in WebSocket
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  if(!window.WebSocket) {
    window.alert('Browser does not support web-sockets');
    return false;
  }

  var openConnection = function () {
    var ws = new WebSocket('ws:' + serverUrl);
    ws.onopen = function () {
      // connection is opened and ready to use
      //console.log('ws.onopen');
    };
    ws.onerror = function (error) {
      // an error occurred when sending/receiving data
      errorCount += 1;
      console.log('error', error);
    };
    ws.onclose = function () {
      console.log('connection::close', arguments);
      if(errorCount < 5) {
        connection = openConnection();
        console.log('reconneting attempt.', errorCount);
        return;
      }

      console.log('reconneting attempt failed.', errorCount);
      var reloadr = confirm('Ooops, I can not connect to server.\n\nOK to reload, or\nCANCEL to abort.');
      if (reloadr) { window.location.reload(); }
      return;
    };
    ws.onmessage = function (message) {
      // try to decode json (I assume that each message from server is json)
      // console.log(message.data);
      var path = message.data.decompress();
      setPath(path);
    };
    return ws;
  };
  var connection = openConnection();




  //console.log('WebSocket', serverUrl);

  app.toggleNextButton = function (visible) {
    $('.nextprev')[visible ? 'removeClass' : 'addClass']('inactive');
  };
  app.next = function () {
    current = typeof current === 'number' ? current : -1;
    current += 1; //list[current + 1] ? 1 : 0;
    current = current < list.length ? current : 0;
    uid = current
    //console.log('current', current);
    app.list(current);
  };
  app.prev = function () {
    current = typeof current === 'number' ? current : 0;
    current -= 1; //list[current + 1] ? 1 : 0;
    current = current < 0 ? list.length - 1 : current;
    uid = current
    //console.log('current', current);
    app.list(current);
  };
  app.list = function (n) {
    var html = '';
    $.each(list, function (i, value) {
      html += String(i + 1000).slice(1) + ': ' + value[0] + '   ';
    });
    if(typeof n !== 'number' || !list[n][0] || uid === list[n][0]) {
      console.log('SVG listing:', html);
      //return list;
    }
    current = isNaN(n) ? Math.floor(Math.random() * list.length - 1) : n;
    app.load(list[n][0]);
    $('.filenumber').html(romanize(current + 1));
    $('.totalnumber').html((current + 1) + '/' + list.length);
    $('.filedescription').html('(loading path data)');
    $('#m' + (current + 1)).addClass('selected');
    window.location.hash = current + 1;
    title.html('lifedrawing (' + romanize(current + 1) + ')');
  };
  app.auto = function () {
    auto = !auto;
    //console.log('auto', auto);
    return auto ? app.next() : null;
  };
  app.load = function (id) {
    if($('#' + id).length) {
      //console.log('ID already exists', id);
      return false;
    }

    // into the DOM we go ....
    uid = id;
    svg = document.createElementNS(NS,"svg");
    document.body.appendChild(svg);

    svg.setAttribute('version', version);
    svg.setAttribute('id', id);
    svg.setAttribute('x', x);
    svg.setAttribute('y', y);
    svg.setAttribute('width', width + 'px');
    svg.setAttribute('height', height + 'px');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('enable-background', enablebackground);
    svg.setAttribute('xml:space',xmlspace);
    canvas.appendChild(svg);

    group = document.createElementNS(NS, "g");
    // group.setAttribute('id', id);
    svg.appendChild(group);

    connection.send(id);
    //console.log('connection.send', id);

    if($('svg').length > 1 && !deleteExisting) {
      count = 0;
      deleteExisting = function () {
        var old = $('svg').first(),
          ms = 550;
        old.fadeOut(ms);
        setTimeout(function() {
          old.remove();
        }, ms + 50);
        /*//console.log('remove existing SVG');
        var old = $('svg').first(),
          n = 0, ms = deleteDurationMs,
          paths = $(old).find('path'),
          x = ms / paths.length;

        old.css('opacity', 0.3);

        paths.each(function (i) {
          // //console.log(i);
          var that = $(this);
          setTimeout(function() {
            that.remove();
          }, n += x);
        });
        setTimeout(function() {
          $(old).remove();
        }, ms);
        // old.remove();*/
        deleteExisting = null;
      };
    }
  };
  app.getLiTag = function (i, array) {
    // console.log(i, romanize(i));
    return $('<a>').data('id', i).attr({'href': '#' + (i), "id": 'm' + i}).append(function () {
      return '<label>' + romanize(i) + '</label><em>' + (array[1] / 1024/ 1024).toFixed(2) + 'Mb</em>';
    })[0];
  };
  app.closeMenu = function () {
    $('#sketchlist').hide(250);
    $('#nav-menu').removeClass('active');
  };

  $('#nav-auto').on('click', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).toggleClass('active');
    $('.nextprev').toggleClass('inactive');
    app.auto();
  });
  $('#nav-next').on('click', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if($(this).hasClass('inactive')) { return; }
    app.next();
    app.closeMenu();
  });
  $('#nav-prev').on('click', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if($(this).hasClass('inactive')) { return; }
    app.prev();
    app.closeMenu();
  });

  $('#nav-menu').on('click', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).toggleClass('active');
    $('#sketchlist').toggle(150);
  });
  $('#sketchmenu').on('click', 'a', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).addClass('selected');
    app.list(parseInt($(this).data('id'),10)-1);
  });
  $('#sketchmenu').on('mouseleave', function (e) {
    app.closeMenu();
  });
  $('#canvas').on('click', app.closeMenu);
  $('.icon.twitter').on('click', '', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    var via = '&via=fliptopbox13',
      text = '&text=' + encodeURIComponent('drawing (' + romanize(current + 1) + ')' + ' ~'),
      url = '?url=' + encodeURIComponent('http://fliptopbox.com/lifedrawing/#' + (current + 1)),
      href = this.href + url + text + via;
    // ?url=tweet-button&text=bruce&via=fliptopbox13
    // console.log(href);
    window.open(href, "twitter","toolbar=no, scrollbars=no, resizable=yes, top=500, left=500, width=400, height=400");
    return false;
  });

  $.get('http:' + serverUrl, function (d) {
    list = d.list.sort(function(a,b) {
      a = parseInt(a[0].replace(/[^0-9]+/, ''),10),
      b = parseInt(b[0].replace(/[^0-9]+/, ''),10);
      return a - b;
    });

    $.each(list, function(i, value) {
      // console.log(value[0], value[1]);
      $('#sketchmenu').append($('<li/>').html(app.getLiTag(i + 1, value)));
    });

    var n = list.length - 1,
      r = Math.floor(Math.random() * n),
      hash = (window.location.hash || String(r)).replace(/[^0-9]+/g, ''),
      index = parseInt(hash - 1, 10);
    index = isNaN(index) || index < 0 ? r : index;
    setTimeout(function() {
      app.list(index);
      current = index;
    }, 500);
  });

}(jQuery));