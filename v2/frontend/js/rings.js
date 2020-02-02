export default rings;
function rings(array) {
    // <div class="circles"></div>
    const circles = document.createElement("div");
    circles.classList.add("circles");

    const sizes = ['zero', 'one', 'two', 'three', 'four', 'five'];
    let max = 0;

    // get max size so we can normalize to a percentage
    array.forEach(value => max = Math.max(value, max));

    //

    for (let i = 0; i < 46; i += 1) {
        const size = sizes[(Math.random() * sizes.length) >> 0];
        const div = document.createElement('div');
        div.classList.add('rings', 'inline', size);
        div.innerHTML = `<em>${size}</em>`;
        circles.append(div);
    }
}
