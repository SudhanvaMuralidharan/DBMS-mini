const fs = require('fs');
const path = require('path');
const Block = require('./Block');
const { generateBlockHash } = require('./HashGenerator');

const CHAIN_FILE = path.join(__dirname, '../../data/blockchain.json');
const DIFFICULTY = 2;

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = DIFFICULTY;
    this._load();
    if (this.chain.length === 0) {
      this.chain.push(this._createGenesis());
      this._save();
    }
  }

  _createGenesis() {
    const g = new Block(0, {
      type: 'GENESIS',
      message: 'Blockchain Audit Trail Initialized',
      system: 'BlockchainAuditDBMS v1.0',
      timestamp: new Date().toISOString()
    }, '0000000000000000000000000000000000000000000000000000000000000000');
    g.hash = g.calculateHash();
    return g;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const prev = this.getLatestBlock();
    const block = new Block(this.chain.length, data, prev.hash);
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this._save();
    return block;
  }

  isChainValid() {
    const issues = [];
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i];
      const prev = this.chain[i - 1];
      const recomputed = generateBlockHash(cur);
      if (cur.hash !== recomputed) {
        issues.push({ index: i, type: 'HASH_MISMATCH', expected: recomputed, found: cur.hash });
      }
      if (cur.previousHash !== prev.hash) {
        issues.push({ index: i, type: 'CHAIN_BREAK', expectedPrev: prev.hash, foundPrev: cur.previousHash });
      }
    }
    return { valid: issues.length === 0, issues, checkedBlocks: this.chain.length };
  }

  getBlock(index) {
    return this.chain[index] || null;
  }

  getStats() {
    const validity = this.isChainValid();
    return {
      length: this.chain.length,
      difficulty: this.difficulty,
      latestHash: this.getLatestBlock().hash,
      valid: validity.valid,
      issues: validity.issues.length
    };
  }

  // For demo: simulate tampering (admin only)
  tamperBlock(index, modification) {
    if (index <= 0 || index >= this.chain.length) return false;
    this.chain[index].data = { ...this.chain[index].data, ...modification, _TAMPERED: true };
    // Note: hash is NOT recalculated — this is what makes it detectable
    this._save();
    return true;
  }

  _save() {
    const dir = path.dirname(CHAIN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CHAIN_FILE, JSON.stringify(this.chain, null, 2));
  }

  _load() {
    try {
      if (fs.existsSync(CHAIN_FILE)) {
        this.chain = JSON.parse(fs.readFileSync(CHAIN_FILE, 'utf-8'));
      }
    } catch { this.chain = []; }
  }
}

module.exports = new Blockchain();