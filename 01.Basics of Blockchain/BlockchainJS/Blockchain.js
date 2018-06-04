const crypto = require('crypto');
const URL = require('url').URL;
const axios = require('axios');

class Blockchain {
    constructor() {
        this.chain = [];
        this.currentTransactions = [];
        this.nodes = new Set();

        // Create the genesis block
        this.newBlock(100, '1');
    }

    //Creates new transaction
    newTransaction(sender, recipient, amount) {
        const transaction = {
            sender,
            recipient,
            amount
        };

        this.currentTransactions.push(transaction);

        return this.lastBlock.index + 1;
    }

    // Creates a new Block and adds it to the chain
    newBlock(proof, previousHash = null) {
        const block = {
            'index': this.chain.length,
            'timestamp': Date.now(),
            'transactions': [...this.currentTransactions],
            proof,
            'previousHash': previousHash || Blockchain.hash(this.lastBlock)
        };

        this.currentTransactions = [];
        this.chain.push(block);

        return block;
    }

    // Simple Proof of Work Algorithm:
    // - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
    // - p is the previous proof, and p' is the new proof
    proofOfWork(lastProof) {
        let proof = 0;

        while (!Blockchain.validProof(lastProof, proof)) {
            proof += 1;
        }

        return proof;
    }

    // Validates the Proof: Does hash contain 4 leading zeroes?
    static validProof(lastProof, proof) {
        const guess = `${ lastProof }${ proof }`;
        const guessHash = crypto
            .createHash('sha256')
            .update(guess)
            .digest('hex');

        return guessHash.indexOf('0000') === 0;
    }

    //Get last block
    get lastBlock() {
        return this.chain[Math.max(0, this.chain.length - 1)];
    }

    // Add a new node to the list of nodes
    registerNode(address) {
        const parsedURL = new URL(address);
        this.nodes.add(parsedURL.host);
    }

    // Creates a SHA-256 hash of a Block
    static hash(block) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(block))
            .digest('hex');
    }

    // Determine if a given blockchain is valid
    static validChain(chain) {
        let lastBlock = chain[0];
        let currentIndex = 1;

        while (currentIndex < chain.length) {
            const block = chain[currentIndex];
            console.log(lastBlock);
            console.log(block);
            console.log('\n-------------\n');

            // Check that the hash of the block is correct
            if (block.previousHash !== Blockchain.hash(lastBlock)) {
                return false;
            }

            if (!Blockchain.validProof(lastBlock.proof, block.proof)) {
                return false;
            }

            lastBlock = block;
            currentIndex += 1;

            return true;
        }
    }

    // This is our Consensus Algorithm, it resolves conflicts
    // by replacing our chain with the longest one in the network.
    async resolveConflicts() {
        const neighbours = this.nodes;
        let newChain = undefined;

        // We're only looking for chains longer than ours
        let maxLength = this.chain.length;

        // Grab and verify the chains from all the nodes in our network
        for (const node of neighbours) {
            const response = await axios(`http://${ node }/chain`);

            if (response.status === 200) {
                const length = response.data.length;
                const chain = response.data.chain;

                // Check if the length is longer and the chain is valid
                if (length > maxLength && Blockchain.validChain(chain)) {
                    maxLength = length;
                    newChain = chain;
                }
            }
        }

        if (newChain) {
            this.chain = newChain;
            return true;
        }

        return false;
    }

}

module.exports = Blockchain;
