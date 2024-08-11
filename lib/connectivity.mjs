// Tested on Vite 5.4.0 + esbuild 0.21.5 + Firefox 115.4.0esr

/* USAGE:

import Room from './connectivity.mjs'

const room = new Room("chungus");
await room.ready;

*/

import Client from 'bittorrent-tracker' // https://github.com/webtorrent/bittorrent-tracker
import Wire from 'bittorrent-protocol' // https://github.com/webtorrent/bittorrent-protocol
import { v5 as uuidv5 } from 'uuid' // https://github.com/uuidjs/uuid
import bencode from 'bencode'
import { arr2hex, arr2text, hash } from 'uint8-util'

import o9Ugc from './webtorrent-ugc.mjs'
import { parse_qs_map, parse_qs_map_all_unique } from './querystring.mjs'


const FIXME_BATTERIES_NOT_INCLUDED = {
	webTorrentTrackers: Array.from(parse_qs_map_all_unique().get('tr') || ['ws://localhost:8000']),
	iceServers: JSON.parse(parse_qs_map().get('iceServers') || "[]"),
};

const PROTOCOL = 'ecfce136-5746-11ef-9566-a01d48f34869';


export default class Room extends EventTarget {
	#torrentTrackerClient;
	#ready;
	#roomPeers;
	#roomPeerWires;
	constructor(roomId, peerId) {
		super();
		this.#ready = this.#_constructor(roomId, peerId);
	}
	async #_constructor(roomId, peerId) {
		if ( peerId === undefined ) peerId = crypto.getRandomValues(new Uint8Array(20));
		this.#roomPeers = new Map();
		this.#roomPeerWires = new WeakMap();
		const client = this.#torrentTrackerClient = new Client({
			infoHash: await roomIdToInfohash(roomId),
			peerId: peerId,
			announce: FIXME_BATTERIES_NOT_INCLUDED.webTorrentTrackers,
			rtcConfig: { iceServers: FIXME_BATTERIES_NOT_INCLUDED.iceServers },
		});
		client.on('peer', (peer) => this.#handlepeer(peer));
		client.on('update', (data) => this.#handleupdate(data));
		client.on('warning', (reason) => this.#handlewarning(reason));
		client.on('error', (reason) => this.#handleerror(reason));
		client.start();
	}

	postMessage(data) {
		data = JSON.stringify(data);
		// FIXME we should use some ring protocol here
		for ( const peer of this.#roomPeers.values() ) {
			const wire = this.#roomPeerWires.get(peer);
			wire.postMessage(data)
		}
	}

	#handleUgc(data, wire) {
		data = JSON.parse(arr2text(data));
		this.dispatchEvent(new MessageEvent('message', { data: { type: 'message', source: wire, value: data } }));
	}

	#handleJoin(wire) {
		this.dispatchEvent(new MessageEvent('message', { data: { type: 'join', source: wire } }));
	}

	#handleLeave(wire) {
		this.dispatchEvent(new MessageEvent('message', { data: { type: 'leave', source: wire } }));
	}

	get ready() {
		return this.#ready;
	}
	get peerId() {
		return this.#torrentTrackerClient.peerId;
	}
	get infoHash() {
		return this.#torrentTrackerClient.infoHash;
	}

	async #handlepeer(peer) {
		{
			const existingPeer = this.#roomPeers.get(peer.id);
			if ( existingPeer && existingPeer.connected ) {
				// FIXME is there any way to access .connected on a Wire object?
				// if so, we can do away with this awkward solution of keeping both Peer and Wire objects
				console.info("IGNORING DUPLICATE PEER: %o", peer);
				return;
			}
		}
		peer.on('close', () => this.#handlePeerClose(peer)); // FIXME WHY THE HELL IS THIS NOT FIRING
		peer.on('error', (reason) => this.#handlePeerError(peer, reason));


		const wire = await new Promise((resolve, reject) => {
			const wire = new Wire();
			wire.use(o9Ugc);
			wire.on('o9_ugc', (data) => this.#handleUgc(data, wire));

			peer.pipe(wire).pipe(peer);
			wire.once('handshake', (infoHash, peerId, extensions) => {
				// receive a handshake (infoHash and peerId are hex strings)
				console.debug("Received handshake from %s: %o\nHe supports these extensions: %o", peerId, wire, extensions);
				resolve(wire);
			});
			wire.handshake(this.infoHash, this.peerId, { o9_ugc: true });
		});

		console.info("NEW FRIEND %s ACQUIRED: %o\nWE HAVE CONFIGURED HIM WITH: %o", peer.id, peer, wire);
		this.#roomPeers.set(peer.id, peer);
		this.#roomPeerWires.set(peer, wire);
		this.#handleJoin(wire);
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

	#handlePeerClose(peer) {
		console.log("Peer %s disconnected", peer.id);
		this.#handleLeave(wire);
	}
	#handlePeerError(peer, reason) {
		console.warn("Peer %s disconnected harshly: %o", peer.id, reason);
	}

}


async function roomIdToInfohash(roomId) {
	return await uuidToInfohash(uuidv5(roomId, PROTOCOL));
}


async function uuidToInfohash(uuid) {
	const PIECE_LENGTH = 64;
	return await hash(bencode.encode({
		length: 36,
		name: "uuid.txt",
		'piece length': PIECE_LENGTH,
		pieces: [await hash(uuid + '\x00'.repeat(PIECE_LENGTH - 36))]
	}));
}
