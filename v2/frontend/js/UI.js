import Metadata from './Metadata.js';
import SVG from './SVG.js';
import highlights from './highlights.js';

class UI {
    constructor(ws) {
        this.container = document.querySelector('#container');

        this.gallery = [];

        this.backgrounds = ['none', 'plywood', 'newsprint'];
        this.current = null; // array index of current sketch
        this.busy = null; // prevent UI events while working
        this.auto = 0; // delay in ms for auto-next
        this.timer; // the timeout manager
        this.bg = 0; // the index for BG images
        this.initDelay = 5000; // the pause before minimal is applied
        this.highlightOn = true;
        this.showMenu = false;
        this.ws = ws;

        this.highlights = highlights;

        this.svg = new SVG(this.container);
        this.menu = this.makeMenu(this.container, this.hanleOnClick);
        this.metadata = new Metadata(this.container);

        this.svg.notify('ui', this.sketchComplete);
        this.svg.handleClick(this.toggle);

        this.initialize();

        window.UI = this;
    }

    initialize() {
        // make fullscreen interface
        // load the first sketch
        // show the labels for a while then
        // goto minimal view

        const welcome = document.querySelector('.welcome');
        const menu = document.querySelector('.menu');
        const minimal = () => menu.classList.add('minimal');

        welcome.onclick = () => {
            document.documentElement.requestFullscreen();
            menu.classList.add('label-show');
            welcome.parentNode.removeChild(welcome);
            setTimeout(minimal, this.initDelay);
            this.load();
        };
    }

    sketchComplete = () => {
        if (this.highlightOn) {
            highlights(30, 0.5, '#000000cc');
            highlights(20, 3);
            highlights(10, 15);
            highlights(5, 45);
        }

        this.busy = false;
        if (this.auto) {
            const fn = () => this.next(1);
            this.timer = setTimeout(fn, this.auto);
        }
    };

    hanleOnClick = (e, onSuccess) => {
        e.preventDefault();
        if (this.busy) return false;

        const el = e.currentTarget;
        this.setCurrent(Number(el.dataset.index));

        this.toggle();
        this.load();
        onSuccess();
    };

    toggle = () => {
        // show or hide the gallery menu

        document.documentElement.requestFullscreen();
        const reverse = !this.showMenu;
        const method = reverse ? 'remove' : 'add';
        const blur = !reverse ? 'remove' : 'add';
        this.menu.classList[method]('menu-hide');
        this.showMenu = reverse;
        this.container.classList[blur]('svg-blur');
    };

    update(collection) {
        // this is only called once
        const callback = this.hanleOnClick;
        const entries = Object.entries(collection);
        const max = entries.reduce(
            (acc, curr) => (curr[1].size > acc ? curr[1].size : acc),
            0
        );
        const fn = array => this.sketchItems(array, max, callback);
        this.gallery = entries.map(fn);
        this.gallery.forEach(el => this.menu.append(el));

        this.getHashValue();
        this.getCurrent();

        // the gallery is ready
        // this.load();
    }

    getHashValue() {
        // the UI can be initialized by location.hash
        // the hash is the sketch number (ie. index + 1)

        const re = /^#(\d+)$/;
        let hash = window.location.hash || '';
        hash = re.test(`${hash}`) ? hash : null;

        if (!hash) return null;

        hash = Number(hash.match(re)[1]) - 1;
        hash = hash % this.gallery.length;

        console.log('Initialize with index [%s]', hash);
        this.current = hash;
    }

    setCurrent(index) {
        // catch wrapping index ie going backward from 0 to last index
        const el = this.gallery[index];
        if(!el) {
            index = this.gallery.length - 1;
        }
        

        // remove previos element's "current" classname
        if (this.current !== null) {
            this.gallery[this.current].classList.remove('current');
            this.gallery[this.current].classList.add('menu-viewed');
        }

        // flag the current sketch element
        this.current = Number(index);
        this.gallery[this.current].classList.add('current');
        return this.current;
    }

    getCurrent() {
        let current = this.current || null;
        const no = ((Math.random() * this.gallery.length) >> 0) + 1;
        current = typeof current === 'number' ? this.current : no;

        return this.setCurrent(current);
    }

    play = (delay = 5000) => {
        if (delay !== this.auto) clearTimeout(this.timer);

        this.auto = delay || 0;
        if (!delay) return;
        if (!this.busy) this.next(1);
    };

    next = (inc = 1) => {
        if (this.busy) return;

        const len = this.gallery.length;
        const index = this.current;
        let next = (index + inc) % len;
        next = next < 0 ? len : next;

        window.location.hash = next + 1;
        this.setCurrent(next);
        this.load();
    };

    load() {
        const { ws, current } = this;

        if (ws && ws.readyState !== 1) {
            console.error('WebSocket not ready');
            return;
        }

        ws.send(`load:${current + 1}`);

        console.log(
            'READY current:%s readyState:%s delay(%s)',
            current,
            ws.readyState
        );
    }

    draw(data) {
        this.busy = true; // reset onComplete callback
        this.metadata.update(data);
        this.svg.update(data).busy;
    }

    makeMenu(container) {
        const menu = document.createElement('div');
        const sketches = document.createElement('div');
        const showHighlights = this.highlightOn;
        const resetAutoPlay = () => {
            this.play(null);
            document.querySelector('.label-play strong').innerHTML = 'play';
        };

        const nav = {
            highlights: [
                showHighlights ? '(on)' : '(off)',
                e => {
                    const txt = e.currentTarget.querySelector('.label-name');
                    this.highlightOn = !this.highlightOn;
                    txt.innerHTML =
                        'highlights ' + (this.highlightOn ? '(on)' : '(off)');
                }
            ],
            next: [
                null,
                () => {
                    this.play(null);
                    this.next(1);
                }
            ],
            play: [
                null,
                e => {
                    const txt = e.currentTarget.querySelector('.label-name');
                    const delay = !this.auto ? 8000 : 0;
                    txt.innerHTML = delay ? 'stop' : 'play';
                    this.play(delay);
                }
            ],
            previous: [
                null,
                () => {
                    resetAutoPlay();
                    this.next(-1);
                }
            ],
            canvas: [
                null,
                () => {
                    const bgs = this.backgrounds;
                    let index = (this.bg + 1) % bgs.length;
                    this.bg = index;
                    document.querySelector('body').className = bgs[index];
                }
            ]
        };

        menu.classList.add('menu');
        sketches.classList.add('menu-sketches', 'menu-hide', 'circles');
        // toggle.classList.add('menu-toggle');
        // toggle.onclick = this.toggle;

        // menu.append(toggle);
        container.append(menu, sketches);

        Object.entries(nav).forEach(array => {
            const el = document.createElement('div');
            const [name, attrs] = array;
            const [value = '', fn] = attrs;

            console.log(attrs);

            const text = value !== null ? value : '';
            el.classList.add('menu-' + name);
            el.onclick = fn;
            el.innerHTML = `<div class="label label-${name}">
                <strong class="label-name">${name} ${text}</strong>
                <em class="label-dot"></em></div>`;
            menu.append(el);
        });

        return sketches;
    }

    sketchItems([_, value], max, handleClick) {
        const { name, size, index, no } = value;
        const a = document.createElement('a');
        const MBytes = Number(size / 1024 / 1024).toFixed(2);
        const sizes = ['zero', 'one', 'two', 'three', 'four', 'five'];

        const n = (Math.ceil((size / max) * 6) >> 0) - 1;
        const radius = sizes[n];

        a.id = `${name}`;
        a.href = `#${no}`;
        a.dataset.no = `${no}`;
        a.dataset.index = `${index}`;
        a.innerHTML = `<i>${no}</i>`;
        a.classList.add('rings', 'inline', radius);
        a.onclick = e => {
            handleClick(e, () => a.classList.add('menu-viewed'));
        };

        a.innerHTML = `
        <div class="menu-item">
            <em class="menu-no">${no}</em>
            <em class="menu-bytes">${MBytes}MB</em>
        </div>`;

        return a;
    }
}

export default UI;
