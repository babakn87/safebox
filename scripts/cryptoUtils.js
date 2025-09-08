const { webcrypto } = require('crypto');
const { subtle } = webcrypto;
const { TextEncoder, TextDecoder } = require('util');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function getKey() {
  const password = `${process.env.KEY}`;
  const enc = new TextEncoder();
  const pwBytes = enc.encode(password);
  const hashBuffer = await subtle.digest("SHA-256", pwBytes);
  return await subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(plainText) {
  const key = await getKey();
  const iv = new Uint8Array(16);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(plainText);
  const encrypted = await subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    dataBuffer
  );
  return new Uint8Array(encrypted);
}

async function decryptData(encryptedBytes) {
  const key = await getKey();
  const iv = new Uint8Array(16);

  let ab;
  if (encryptedBytes instanceof ArrayBuffer) {
    ab = encryptedBytes;
  } else if (ArrayBuffer.isView(encryptedBytes)) {
    ab = encryptedBytes.buffer;
  } else if (Buffer.isBuffer(encryptedBytes)) {
    ab = encryptedBytes.buffer.slice(encryptedBytes.byteOffset, encryptedBytes.byteOffset + encryptedBytes.byteLength);
  } else {
    throw new Error("Unsupported encryptedBytes type");
  }

  const decrypted = await subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    ab
  );
  return new TextDecoder().decode(decrypted);
}

module.exports = { encryptData, decryptData };
