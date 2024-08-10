import Room from './connectivity.mjs'

const roomId = prompt("Enter the password for the room you want to join.", btoa(Array.from(crypto.getRandomValues(new Uint8Array(12)), i => String.fromCharCode(i)).join("")).replaceAll(/[+/]/g, s => {switch (s) {case '+': return '-'; case '/': return '_';}}));

const room = new Room(roomId);
await room.ready;

console.info(room);
document.title = room.peerId;
