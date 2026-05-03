const { generateBlockHash } = require('./HashGenerator');

class Block {
  constructor(index, data, previousHash = '0000000000000000') {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return generateBlockHash(this);
  }

  mineBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    return this.hash;
  }
}

module.exports = Block;