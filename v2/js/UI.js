import Metadata from './Metadata.js';
import SVG from './SVG.js';
import highlights from './highlights.js';

class UI {
    constructor(ws) {
        this.container = document.querySelector('#container');

        this.gallery = [];

        this.menu = this.makeMenu(this.container, this.hanleOnClick);
        this.metadata = new Metadata(this.container);
        this.svg = new SVG(this.container);

        this.welcome = 5000;
        this.current = null; // array index of current sketch
        this.busy = null; // prevent UI events while working
        this.auto = 0; // delay in ms for auto-next
        this.timer; // the timeout manager
        this.highlight = true;
        this.showMenu = false;
        this.ws = ws;

        this.svg.notify('ui', this.sketchComplete);
        this.svg.handleClick(this.toggle);

        this.highlights = highlights;

        window.UI = this;
    }

    sketchComplete = () => {
        if (this.highlight) {
            highlights(30, 0.5, "#000000cc");
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
        this.current = Number(el.dataset.index);
        this.toggle();
        this.load();
        onSuccess();
    };

    toggle = () => {
        // show or hide the gallery menu

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
        const fn = array => this.template(array, max, callback);
        this.gallery = entries.map(fn);
        this.gallery.forEach(el => this.menu.append(el));

        this.getHashValue();
        this.getCurrent();
        this.load();
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

    getCurrent() {
        let current = this.current || null;
        const no = ((Math.random() * this.gallery.length) >> 0) + 1;
        current = typeof current === 'number' ? this.current : no;

        this.current = current;
        return current;
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
        const next = (index + inc) % len;

        this.current = next < 0 ? len : next;
        this.load();
    };

    load() {
        const { welcome, ws, current } = this;

        if (ws && ws.readyState !== 1) {
            console.error('WebSocket not ready');
            return;
        }

        const fn = () => {
            window.location.hash = current + 1;
            ws.send(`load:${current + 1}`);
            this.welcome = 0; // remove the inital load delay
        };

        console.log(
            'READY current:%s readyState:%s delay(%s)',
            current,
            ws.readyState,
            welcome
        );

        // wait a moment for the welcome screen to be read
        setTimeout(fn, welcome);
    }

    draw(data) {
        this.busy = true; // reset onComplete callback
        this.metadata.update(data);
        this.svg.update(data).busy;
    }

    makeMenu(container) {
        const menu = document.createElement('div');
        const sketches = document.createElement('div');
        const toggle = document.createElement('div');

        menu.classList.add('menu');
        sketches.classList.add('menu-sketches', 'menu-hide', 'circles');
        toggle.classList.add('menu-toggle');
        toggle.onclick = this.toggle;

        menu.append(toggle);
        container.append(menu, sketches);
        return sketches;
    }

    template([_, value], max, handleClick) {
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
        // a.classList.add('menu-sketch');
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
