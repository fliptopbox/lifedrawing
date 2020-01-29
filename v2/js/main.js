import ascii from "./ascii.js";
import {decompress} from "./lzw.js";
import UI from "./UI.js";

String.prototype.decompress = decompress;

console.log(ascii);


const host = `ws://localhost:5000`;
const ws = new WebSocket(host);
const ui = new UI(ws);

window.ui = ui;

ws.onopen = handleOnOpen;
ws.onerror = handleException;
ws.onclose = handleException;
ws.onmessage = handleMessage;


function handleOnOpen () {
    ws.send("list");
}

function handleMessage(e) {
    const {data} = e;
    const string = data.decompress();
    const json = JSON.parse(string);
    const {cmd} = json;

    switch(cmd) {
        case "draw":
            ui.draw(json);
            break;

        case "list":
            ui.update(json.data);
            break;

        default:
            console.warn("Unknown command [%s]", cmd);
            break;
    }
}

function handleException (e) {
    console.warn("Something happend", e);
}


