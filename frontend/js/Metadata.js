import romanize from './romanize.js';
class Metadata {
    constructor(container) {
        const meta = this.createDiv('meta');
        const percent = this.createDiv('meta-percent');
        const title = this.createDiv('meta-title');
        const desc = this.createDiv('meta-desc');
        const no = this.createDiv('meta-no');

        meta.append(percent, title, desc, no);
        container.append(meta);

        this.$ = { container, percent, title, desc, no };
        this.busy = false;
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

    title = string => {
        if (!string) return;
        this.$.title.innerHTML = string;
    };

    desc = string => {
        if (!string) return;
        this.$.desc.innerHTML = string;
    };

    no = integer => {
        if (!integer) return;
        this.$.no.innerHTML = romanize(integer);
    };

    update = data => {
        const { type, value, no, percent } = data;

        // handle title & desc, both use "value"
        if (this[type]) this[type](value);

        this.percent(percent);
        this.no(no);

        return this;
    };
}

export default Metadata;
