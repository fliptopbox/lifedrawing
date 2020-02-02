export default highlights;

function highlights(
    percent = 20,
    width = 1,
    color = '#ffffff66',
    length = 15000
) {
    const paths = document.querySelectorAll('.svg-path');
    const array = Array.prototype.filter.call(paths, (el) => {
        const p = el.getAttribute('d');
        return p.length > length;
    });

    // console.log("total: %s - filtered: %s", paths.length, array.length);

    const style = `stroke-width: ${width}; stroke: ${color}`;
    const count = (array.length * (percent / 100)) >> 0;


    for (let i = 0; i < count; i += 1) {
        setTimeout(function() {
            array[(Math.random() * array.length) >> 0].style = style;
        }, i * 150);
    }
}
