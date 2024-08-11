function _parse_qs_array(search) {
	if(search === undefined) search = window.location.search;
	let m = search.match(/^\?(.+)$/s);
	let params = m ? m[1].split('&') : new Array();
	return params.map(s => {
		let [key, value] = s.match(/^(.*?)(?:=(.*))?$/s).slice(1);
		key = decodeURIComponent(key.replaceAll('+', '%20'));
		value = (value !== undefined ) ? decodeURIComponent(value.replaceAll('+', '%20')) : null;
		return [key, value];
	});
}


export function parse_qs_map(search) {
	// Parses the given query string, returning the results as a Map.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys take on the LAST value provided (like PHP's parse_str).
	return new Map(_parse_qs_array(search));
}

export function parse_qs_obj(search) {
	// Parses the given query string, returning the results as an Object.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys take on the LAST value provided (like PHP's parse_str).
	return Object.fromEntries(_parse_qs_array(search));
}


export function parse_qs_map_first(search) {
	// Parses the given query string, returning the results as a Map.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys take on the FIRST value provided (like URLSearchParams).
	return new Map(_parse_qs_array(search).reverse());
}

export function parse_qs_obj_first(search) {
	// Parses the given query string, returning the results as an Object.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys take on the FIRST value provided (like URLSearchParams).
	return Object.fromEntries(_parse_qs_array(search).reverse());
}


export function parse_qs_map_all(search) {
	// Parses the given query string, returning the results as a Map with Array values.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys are all returned, in-order.
	const map = new Map();
	_parse_qs_array(search).forEach(([key, value]) => {
		if(! map.has(key) ) map.set(key, new Array());
		map.get(key).push(value);
	});
	return map;
}

export function parse_qs_obj_all(search) {
	// Parses the given query string, returning the results as an Object with Array values.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys are all returned, in-order.
	const obj = new Object();
	_parse_qs_array(search).forEach(([key, value]) => {
		if( obj[key] === undefined ) obj[key] = new Array();
		obj[key].push(value);
	});
	return obj;
}


export function parse_qs_map_all_unique(search) {
	// Parses the given query string, returning the results as a Map with Set values.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys are all returned. (Duplicate key-value pairs have no effect.)
	const map = new Map();
	_parse_qs_array(search).forEach(([key, value]) => {
		if(! map.has(key) ) map.set(key, new Set());
		map.get(key).add(value);
	});
	return map;
}

export function parse_qs_obj_all_unique(search) {
	// Parses the given query string, returning the results as an Object with Set values.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys are all returned. (Duplicate key-value pairs have no effect.)
	const obj = new Object();
	_parse_qs_array(search).forEach(([key, value]) => {
		if( obj[key] === undefined ) obj[key] = new Set();
		obj[key].add(value);
	});
	return obj;
}


export function parse_qs_map_1(search) {
	// Parses the given query string, returning the results as a Map.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys will cause this function to throw a SyntaxError.
	const map = new Map();
	_parse_qs_array(search).forEach(([key, value]) => {
		if( map.has(key) ) throw new SyntaxError(`${arguments.callee.name}: duplicate key`);
		map.set(key, value);
	});
	return map;
}

export function parse_qs_obj_1(search) {
	// Parses the given query string, returning the results as an Object.
	// Naked keys (without an equals-sign) are taken to have null values.
	// Duplicate keys will cause this function to throw a SyntaxError.
	const obj = new Object();
	_parse_qs_array(search).forEach(([key, value]) => {
		if( obj[key] !== undefined ) throw new SyntaxError(`${arguments.callee.name}: duplicate key`);
		obj[key] = value;
	});
	return obj;
}
