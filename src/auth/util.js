import {Principal} from "@dfinity/principal";
import {sha224} from '@dfinity/principal/lib/esm/utils/sha224';
import {getCrc32} from '@dfinity/principal/lib/esm/utils/getCrc';

// add geekfactory-ic-js-util and remove this file

/**
 * number as byte array
 * @param {number} num
 * @return {number[]} byte array
 */
const to32bits = (num) => {
    let b = new ArrayBuffer(4);
    new DataView(b).setUint32(0, num);
    return Array.from(new Uint8Array(b));
}

/**
 * hex string from byte array
 * @param {number[]} byteArray
 * @return {string} hex string
 */
const toHexString = (byteArray) => {
    return Array.from(byteArray, function (byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

const getSubAccountArray = (s) => {
    if (Array.isArray(s)) {
        return s.concat(Array(32 - s.length).fill(0));
    } else {
        //32-bit number only
        return Array(28).fill(0).concat(to32bits(s ? s : 0))
    }
};

/**
 * @param {string} principal
 * @param {number} subAccount
 * @return {string}
 */
const principalToAccountIdentifier = (principal, subAccount) => {
    const padding = Buffer("\x0Aaccount-id");
    const array = new Uint8Array([
        ...padding,
        ...Principal.fromText(principal).toUint8Array(),
        ...getSubAccountArray(subAccount)
    ]);
    const hash = sha224(array);
    const checksum = to32bits(getCrc32(hash));
    const array2 = new Uint8Array([
        ...checksum,
        ...hash
    ]);
    return toHexString(array2);
};

export const Util = {
    principalToAccountIdentifier: principalToAccountIdentifier,
}
