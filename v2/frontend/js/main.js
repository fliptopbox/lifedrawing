import statusMessage from "./status.js";
import ascii from "./ascii.js";
import { decompress } from "./lzw.js";
import UI from "./UI.js";

String.prototype.decompress = decompress;

console.log(ascii);

const { protocol, origin } = window.location;
const localhost = /localhost/i.test(origin);
const host = localhost ? "localhost:5000/" : "lifedrawing.herokuapp.com/";
const prefix = /s:$/.test(protocol) ? "wss" : "ws";

const paths = document.querySelectorAll("path");

let refresh;
let ws;
let ui;

applyRandomStrokes();

fetch(`//${host}`)
    .then(onFetch)
    .then(onPayload)
    .then(onConnect)
    .catch((e) => {
        statusMessage("failed");
        console.warn(e);
    });

function onFetch(r) {
    statusMessage("fetch");
    return r.json();
}

function onPayload() {
    statusMessage("payload");
    return new WebSocket(`${prefix}:${host}`);
}

function onConnect(socket) {
    statusMessage("connect");
    ws = socket;

    ui = new UI(ws);
    window.ui = ui;

    ws.onmessage = handleMessage;
    ws.onopen = handleOnOpen;
    ws.onerror = handleException;
    ws.onclose = handleClose;
}

function handleOnOpen() {
    statusMessage("download");
    socketLog("Connected", host);
    ws.send("list");
}

function handleClose() {
    socketLog("Closed", host);
}

function handleMessage(e) {
    const { data } = e;
    const string = data.decompress();
    const json = JSON.parse(string);
    const { cmd } = json;

    switch (cmd) {
        case "draw":
            ui.draw(json);
            break;

        case "list":
            socketLog("Recieved list", json);
            statusMessage("");
            ui.initialize(json.data);
            break;

        default:
            socketLog("Unknown command", cmd);
            break;
    }
}

function handleException(e) {
    alert("Hmmm, the server is misbehaving :(");
    console.warn("Something happend", e);
}

function socketLog(verb, message) {
    console.log(
        `%c${verb}`,
        "background: black; color: white; padding: 5px;",
        message
    );
}

function applyRandomStrokes() {
    clearStrokes();
    clearTimeout(refresh);

    Array.from(paths)
        .filter((el) => Math.random() > 0.7)
        .forEach((el, i) => addClassName(el, i, true));

    refresh = setTimeout(applyRandomStrokes, 3000);
}

function clearStrokes() {
    document
        .querySelectorAll(".stroke")
        .forEach((el, i) => addClassName(el, i, false));
}

async function addClassName(el, i, name, ms = 150) {
    const stroke = "stroke";
    const other = ["one", "two", "three"][((Math.random() * 10) >> 0) % 3];
    const value = name ? `stroke stroke-${other}` : "";
    setTimeout(() => {
        el.setAttributeNS(null, "class", value);
    }, i * ms);
}
