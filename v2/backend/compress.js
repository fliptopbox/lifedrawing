/*
	LZW Compression/Decompression for Strings
	Implementation of LZW algorithms from:
	http://rosettacode.org/wiki/LZW_compression#JavaScript

	Usage:
	var a = 'a very very long string to be squashed';
	var b = a.compress(); // 'a veryāăąlong striċ to bečquashed'
	var c = b.uncompress(); // 'a very very long string to be squashed'
	console.log(a === c); // True

	var d = a.compress(true); // return as Array
	console.log(d); // [97, 32, 118 .... 101, 100] an Array of ASCII codes

*/

String.prototype.compress = function (option /* Boolean OR String */, dictLength) {
	"use strict";
	// Build the dictionary.
	// Arguments:
	// @option as Boolean -- returns an Array of intergers
	// @option as String -- returns string with an ID prefix
	// @option as Number -- sets the dictSize
	var i,
		returnAsArray = (option === true),
		prefix = typeof option === 'string' ? option : '',
		dictionary = {},
		uncompressed = this,
		c,
		wc,
		w = "",
		result = [],
		ASCII = '',
		dictSize = dictLength || 256;

	for (i = 0; i < dictSize; i += 1) {
		dictionary[String.fromCharCode(i)] = i;
	}

	for (i = 0; i < uncompressed.length; i += 1) {
		c = uncompressed.charAt(i);
		wc = w + c;
		//Do not use dictionary[wc] because javascript arrays
		//will return values for array['pop'], array['push'] etc
		// if (dictionary[wc]) {
		if (dictionary.hasOwnProperty(wc)) {
			w = wc;
		} else {
			result.push(dictionary[w]);
			ASCII += String.fromCharCode(dictionary[w]);
			// Add wc to the dictionary.
			dictionary[wc] = dictSize++;
			w = String(c);
		}
	}

	// Output the code for w.
	if (w !== "") {
		result.push(dictionary[w]);
		ASCII += String.fromCharCode(dictionary[w]);
	}
	return returnAsArray ? result : (prefix + ASCII);
};

String.prototype.decompress = function (prefix, dictLength) {
	"use strict";
	// Build the dictionary.
	prefix = prefix || ''; // an id pattern
	prefix = prefix.length && this.slice(0, prefix.length) === prefix ? prefix : '';

	var i, tmp = [],
		dictionary = [],
		compressed = this.slice(prefix.length),
		w,
		result,
		k,
		entry = "",
		dictSize = dictLength || 256;
	for (i = 0; i < dictSize; i += 1) {
		dictionary[i] = String.fromCharCode(i);
	}

	if(compressed && typeof compressed === 'string') {
		// convert string into Array.
		for(i = 0; i < compressed.length; i += 1) {
			tmp.push(compressed[i].charCodeAt(0));
		}
		compressed = tmp;
		tmp = null;
	}

	w = String.fromCharCode(compressed[0]);
	result = w;
	for (i = 1; i < compressed.length; i += 1) {
		k = compressed[i];
		if (dictionary[k]) {
			entry = dictionary[k];
		} else {
			if (k === dictSize) {
				entry = w + w.charAt(0);
			} else {
				return null;
			}
		}

		result += entry;

		// Add w+entry[0] to the dictionary.
		dictionary[dictSize++] = w + entry.charAt(0);

		w = entry;
	}
	return result;
};