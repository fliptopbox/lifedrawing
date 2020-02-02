import romanize from './romanize.js';
class Metadata {
    constructor(container) {
        const meta = this.createDiv('meta');
        const percent = this.createDiv('meta-percent');
        const title = this.createDiv('meta-title');
        const desc = this.createDiv('meta-desc');

        meta.append(percent, title, desc);
        container.append(meta);

        this.$ = { container, percent, title, desc };
        this.busy = false;
        this.file = null; // filename and bytes
    }

    createDiv(classname) {
        const el = document.createElement('div');
        el.classList.add(classname);
        return el;
    }

    percent = float => {
        const int = ((float % 1) * 100) >> 0;
        this.busy = int > 0;
        this.$.percent.style.setProperty('--percent', `${int}%`);
    };

    /* image description */
    title = string => {
        if (!string) return;
        this.$.title.innerHTML = `${ string }`;
    };

    /* copyright */
    desc = string => {
        if (!string) return;
        // replace the full (c) statement with a generic one
        const year = romanize((new Date().getFullYear()));

        string = [
            `&copy; ${year}`,
            `<a href="http://fliptopbox.com/" target="_blank">fliptopbox</a>`,
            this.file.id,
            String(((this.file.size / 1024 / 1024) * 1000 >> 0) / 1000) + " MBytes",
        ].join(" - ");
        this.$.desc.innerHTML = `${ string }`;
    };


    update = data => {

        // if(data.type && /^(g|path)$/i.test(data.type)) return;

        const { type, value, percent, id, size } = data;

        if(percent === 0) this.file = {id, size}

        // title & desc, both use "value"
        if (this[type]) this[type](value);

        this.percent(percent);

        return this;
    };
}

export default Metadata;
