import Room from './lib/connectivity.mjs'

if ( !window.location.search )
	window.location.replace('?tr=wss://tracker.files.fm:7073/announce&tr=wss://tracker.webtorrent.dev&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&iceServers=[{%22urls%22:[%22stun:stun.l.google.com:19302%22]}]')

const roomId = prompt("Enter the password for the room you want to join.\n(By default is a random password you can copy and send to friends!)", btoa(Array.from(crypto.getRandomValues(new Uint8Array(12)), i => String.fromCharCode(i)).join("")).replaceAll(/[+/]/g, s => {switch (s) {case '+': return '-'; case '/': return '_';}}));

const room = new Room(roomId);
await room.ready;

document.title = `${room.peerId}@${roomId}`;
console.debug(room);

const chat_log = document.createElement('ul');
function showMessage(sender, message) {
	const chat_message = document.createElement('li');
	const sender_label = document.createElement('span');
	sender_label.textContent = sender;
	const chat_message_body = document.createElement('span');
	chat_message_body.textContent = message;
	chat_message.appendChild(sender_label);
	chat_message.appendChild(document.createTextNode(': '));
	chat_message.appendChild(chat_message_body);
	chat_log.prepend(chat_message);
}
room.addEventListener('message', (event) => {
	const { data: { type: messageType, source, value: message } } = event;
	switch ( messageType ) {
		case 'message': {
			switch (message.type) {
				case 'chat': {
					showMessage(source.peerId, message.value);
				} break;
			}
		} break;
		case 'join': {
			showMessage(source.peerId, '<joined>');
		} break;
		case 'leave': {
			showMessage(source.peerId, '<left>');
		} break;
	}
});

const chat_box = document.createElement('form');
chat_box.action = 'javascript:';
chat_box.appendChild(document.createElement('input'));
chat_box.appendChild(document.createElement('submit'));
chat_box.addEventListener('submit', (event) => {
	const chatMessage = event.target.elements[0].value;
	room.postMessage({
		type: 'chat',
		value: chatMessage
	});
	showMessage(room.peerId, chatMessage);
});

document.body.appendChild(chat_log);
chat_log.insertAdjacentElement('beforebegin', chat_box);
