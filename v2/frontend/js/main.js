import ascii from './ascii.js';
import { decompress } from './lzw.js';
import UI from './UI.js';

String.prototype.decompress = decompress;

console.log(ascii);

const localhost = /localhost/i.test(window.location.origin);
const host = localhost ? 'localhost:5000/' : 'lifedrawing.herokuapp.com/';
const ws = new WebSocket(`ws://${host}`);
const ui = new UI(ws);

window.ui = ui;

ws.onopen = handleOnOpen;
ws.onerror = handleException;
ws.onclose = handleClose;
ws.onmessage = handleMessage;

function handleOnOpen() {
    socketLog("Connected", host);
    ws.send('list');
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
        case 'draw':
            ui.draw(json);
            break;

        case 'list':
            socketLog("Recieved list", json);
            ui.update(json.data);
            break;

        default:
            socketLog("Unknown command", cmd);
            break;
    }
}

function handleException(e) {
    alert("Hmmm, the server is misbehaving :(");
    console.warn('Something happend', e);
}

function socketLog(verb, message) {
    console.log(`%c${verb}`, "background: black; padding: 5px;", message);
}
