// OTC Settlement Contract ABI
// Simple settlement contract for PrivOTC matched trades

export const OTCSettlement = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "matchId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "buyOrderCommitment",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "sellOrderCommitment",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenPairAddress",
        "type": "address"
      }
    ],
    "name": "executeSettlement",
    "outputs": [
      {
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "matchId",
        "type": "bytes32"
      }
    ],
    "name": "getSettlementStatus",
    "outputs": [
      {
        "internalType": "bool",
        "name": "settled",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "settlementTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "matchId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "buyOrderCommitment",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "sellOrderCommitment",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "SettlementExecuted",
    "type": "event"
  }
] as const;
