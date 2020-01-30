class SVG {
    constructor(container) {
        this.container = container;
        this.svg = null;
        this.groups = [];
        this.filename = null;
        this.triggers = [];
        this.busy = false;
        this.click = (e) => console.log(e);
    }

    handleClick (fn) {
        this.click = fn;
    }

    notify(key, callback) {
        console.log("registering callback", key);
        this.triggers.push(callback);
    }

    complete (data) {
        // notifiy subscribers
        this.triggers.forEach(trigger => trigger(data));
    }

    update(data) {
        let { id, size, type, attributes, percent, value, no } = data;

        type = percent === 0 && no ? 'init' : type;
        type = percent === 1 ? 'done' : type;
        this.busy = percent < 1;


        switch (type || 'unknown') {
            case 'init':
                let old = this.container.querySelector('svg');
                this.container.removeChild(old);
                this.filename = id;
                this.size = size;
                break;

            case 'svg':
                attributes = { ...attributes, id: this.filename };
                this.svg = getSvgElement('svg', attributes, ['svg-sketch']);
                this.container.appendChild(this.svg);
                this.groups = [];
                this.svg.onclick = (e) => this.click(e);
                break;

            case 'title': // removed - it behaves as a tooltip on hover
                break;

            case 'defs':
            case 'desc':
                const tag = getSvgElement(type, String( value || "" ), [`svg-${type}`] );
                this.svg.appendChild(tag);
                break;

            case 'g':
                const last = this.groups.length;
                const classnames = ['svg-group', `group-${last}`];
                const g = getSvgElement(type, attributes, classnames);
                const group = last === 0 ? this.svg : this.groups[last - 1];

                group.appendChild(g);
                this.groups.push(g);
                break;

            case 'path':
                // a path is always nested within a group
                let parent = this.groups[this.groups.length - 1];
                const path = getSvgElement(type, attributes, ['svg-path']);
                parent.appendChild(path);
                break;

            case 'done':
                this.complete(data);
                break;

            default:
                console.warn('!!!!!!', type, data);
                break;
        }

        return this;
    }
}

function getSvgElement(
    type,
    attributes,
    classnames = null,
    ns = 'http://www.w3.org/2000/svg'
) {
    const el = document.createElementNS(ns, type);

    if (typeof attributes === "string") {
        el.innerHTML = attributes;
    }

    if (attributes && attributes.constructor === Object) {
        Object.entries(attributes).forEach(array => {
            const [key, value] = array;
            el.setAttribute(key, value);
        });
    }

    if (classnames && classnames.constructor === Array) {
        el.classList.add(...classnames);
    }
    return el;
}

export default SVG;
