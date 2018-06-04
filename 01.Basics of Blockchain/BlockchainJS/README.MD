# Introduction
This repository implements simple blockchain using **Javascript**. It is a rewrite of the original one created in Python from this [article](https://hackernoon.com/learn-blockchains-by-building-one-117428612f46) and this [TypeScript](https://github.com/Predjo/blockchain-ts) implementation.

# Usage
Download or clone repo.
Run `npm install` 
Run `npm start --port <port-number>` to start the blockchain node.

# Proof of Work algorithm
Blockchain implements basic Proof of Work algorithm. Miners need to find a number that, when hashed with the previous block’s solution (proof), creates a hash with 4 leading 0s ('0000').  
Blockchain class methods *proofOfWork* and *validProof* implements Proof of Work algorithm.

# Consensus algorithm
Consensus algorithm ensures that all nodes in decentralized network reflect the same blockchain. Rule of Consensus algorithm is that the longest valid chain is authoritative. It is achieved by sending the whole chain to each of the nodes.
