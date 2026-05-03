const crypto = require("crypto");

function generateHash(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
}

function generateBlockHash({ index, timestamp, data, previousHash, nonce }) {
  return generateHash({ index, timestamp, data, previousHash, nonce });
}

module.exports = { generateHash, generateBlockHash };
