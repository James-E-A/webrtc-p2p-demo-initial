// Tested on Vite 5.4.0 + esbuild 0.21.5 + Firefox 115.4.0esr

import Client from 'bittorrent-tracker' // https://github.com/webtorrent/bittorrent-tracker
import Protocol from 'bittorrent-protocol' // https://github.com/webtorrent/bittorrent-protocol
import { v5 as uuidv5 } from 'uuid' // https://github.com/uuidjs/uuid
import bencode from 'bencode'
import { arr2hex, hash } from 'uint8-util'


const FIXME_BATTERIES_NOT_INCLUDED = {
	// hard-coding a few public servers as a temporary salve during development

	webTorrentTrackers: [
	//	"ws:///localhost:8000",
		"wss://tracker.files.fm:7073/announce",
		"wss://tracker.webtorrent.dev",
		"wss://tracker.btorrent.xyz",
		"wss://tracker.openwebtorrent.com"
	],
	rtcConfig: {
		iceServers: window.location.hostname === 'localhost' ? [] : [
			{ "urls": [ "stun:stun.l.google.com:19302" ] }
		]
	}
};


export default class Room {
	#torrentTrackerClient;
	#ready;
	constructor(roomId, peerId) {
		this.#ready = this.#_constructor(roomId, peerId);
	}
	async #_constructor(roomId, peerId) {
		if ( peerId === undefined ) peerId = crypto.getRandomValues(new Uint8Array(20));
		const client = this.#torrentTrackerClient = new Client({
			infoHash: await roomIdToInfohash(roomId),
			peerId: peerId,
			announce: FIXME_BATTERIES_NOT_INCLUDED.webTorrentTrackers,
			rtcConfig: FIXME_BATTERIES_NOT_INCLUDED.rtcConfig
		});
		client.on('peer', this.#handlepeer.bind(this));
		client.on('update', this.#handleupdate.bind(this));
		client.on('warning', this.#handlewarning.bind(this));
		client.on('error', this.#handleerror.bind(this));
		client.start();
	}
	get ready() {
		return this.#ready;
	}
	get peerId() {
		return this.#torrentTrackerClient.peerId;
	}
	#handlepeer(peer) {
		console.info(peer);
		debugger;
	}
	#handleupdate(data) {
		console.debug("Tracker announce: %o", data);
	}
	#handlewarning(reason) {
		console.warn(reason);
	}
	#handleerror(reason) {
		console.error(reason);
		console.warning("^FIXME THIS ERROR SHOULD BE FATAL");
	}


}


async function roomIdToInfohash(roomId) {
	return await uuidToInfohash(uuidv5(roomId, 'ecfce136-5746-11ef-9566-a01d48f34869'));
}


async function uuidToInfohash(uuid) {
	return await hash(bencode.encode({
		length: 36,
		name: "uuid.txt",
		'piece length': 64,
		pieces: [await hash(uuid + '\x00'.repeat(28))]
	}));
}
