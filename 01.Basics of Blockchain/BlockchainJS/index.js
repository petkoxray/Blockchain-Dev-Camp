const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid4');
const parseArgs = require('minimist');
const Blockchain = require('./Blockchain');

const args = parseArgs(process.argv.slice(2));

const app = express();
const port = args.port || 3000;

const nodeIndentifier = String(uuid()).replace(/-/g, '');

const blockchain = new Blockchain();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// REST API
app.get('/mine', (req, res) => {

    // We run the proof of work algorithm to get the next proof...
    const lastBlock = blockchain.lastBlock;
    const lastProof = lastBlock.proof;
    const proof = blockchain.proofOfWork(lastProof);

    // We must receive a reward for finding the proof.
    // The sender is "0" to signify that this node has mined a new coin.
    blockchain.newTransaction('0', nodeIndentifier, 1);

    // Forge the new Block by adding it to the chain
    const block = blockchain.newBlock(proof);

    res.status(200).send({
        message: 'New Block Forged',
        index: block.index,
        transactions: block.transactions,
        proof: block.proof,
        previousHash: block.previousHash,
    });

});

app.post('/transactions/new', (req, res) => {
    // Check that the required fields are in the POST'ed data
    if (!(req.body.sender && req.body.recipient && req.body.amount)) {
        res.status(400).send('Missing values');
    }
    
    // Create a new Transaction
    const index = blockchain.newTransaction(
        req.body.sender, req.body.recipient, req.body.amount);

    res.send(`Transaction will be added to Block ${ index }`);
});

app.get('/chain', (req, res) => {
    res.status(200).send({
        chain: blockchain.chain,
        length: blockchain.chain.length,
    });
});

app.post('/nodes/register', (req, res) => {
    const nodes = req.body.nodes;

    if (!nodes) {
        res.status(400).send('Error: Please supply a valid list of nodes');
        return;
    }

    for (const node of nodes) {
        blockchain.registerNode(node);
    }

    res.status(201).send({
        message: 'New nodes have beend added',
        totalNodes: blockchain.nodes.size,
    });
});

app.get('/nodes/resolve', (req, res) => {
    blockchain.resolveConflicts().then((replaced) => {
        res.status(200).send({
            message: replaced ? 'Our chain was replaced' : 'Our chain is authoratative',
            chain: blockchain.chain,
        });
    });
});

app.listen(port);
console.log('Hello from the Blockchain server started on ' + port);