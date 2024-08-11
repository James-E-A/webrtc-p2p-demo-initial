import { EventEmitter } from 'events' // https://github.com/davidmyersdev/vite-plugin-node-polyfills/blob/v0.22.0/pnpm-lock.yaml#L1451
import bencode from 'bencode'
import { arr2text } from 'uint8-util'


class o9Ugc {
	static name = 'o9_ugc';

	constructor(wire) {
		this._wire = wire;
		wire.postMessage = this._postMessage.bind(this); // FIXME how are we *supposed* to do this??
	}

	onHandshake (infoHash, peerId, extensions) {
		this._infoHash = infoHash;
	}

	onExtendedHandshake (handshake) {
		if (!handshake.m || !handshake.m.o9_ugc) {
			return this.emit('warning', new Error('Peer does not support o9_ugc'));
		}
		console.log("o9_ugc enabled: %o", this._wire);
	}

	_postMessage(data) {
		// FIXME how to expose this function?
		this._wire.extended('o9_ugc', bencode.encode(data));
	}

	onMessage (buf) {
		let data;
		console.debug("o9_ugc: got packet %o", buf);
		try {
			data = bencode.decode(arr2text(buf))
		} catch (error) {
			// drop invalid messages
			console.debug("o9_ugc: ignoring message due to %o\n%o", error, buf);
			return;
		}

		try {
			console.debug("o9_ugc: got plaintext message %o", arr2text(data));
		} catch (error) {
			console.debug("o9_ugc: got message %o", data);
		}

		this._wire.emit('o9_ugc', data);
	}
}

o9Ugc.prototype.name = o9Ugc.name; // API needful https://github.com/webtorrent/bittorrent-protocol/blob/v4.1.14/index.js#L207
export default o9Ugc;
