
const status = document.querySelector(".status");
export default function statusMessage(s = null) {
    console.log(">>", s);
    const span = s ? `<span>${s}</span>` : "";
    status.innerHTML = span;
}

