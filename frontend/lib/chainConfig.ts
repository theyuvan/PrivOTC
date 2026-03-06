/**
 * Dual-Chain Configuration
 * 
 * Ethereum Chain: For ETH-based trades
 * World Chain: For WLD-based trades
 */

export const CHAIN_CONFIG = {
  ethereum: {
    chainId: 9991,
    name: 'Tenderly Ethereum',
    rpc: 'https://virtual.mainnet.eu.rpc.tenderly.co/9b993a3b-a915-4d11-9283-b43800cd39a5',
    escrow: '0xB61eC46b61E2B5eAdCB00DEED3EaB87B8f1dbC9f',
    settlement: '0x41A580044F41C9D6BDe5821A4dF5b664A09cc370',
    proofVerifier: '0x30da6632366698aB59d7BDa01Eb22B7cb474D57C',
    nativeToken: {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    tradingPairs: ['ETH/USDC'], // Can add more ERC20 pairs later
  },
  worldChain: {
    chainId: 999480,
    name: 'Tenderly World Chain',
    rpc: 'https://virtual.worldchain-mainnet.eu.rpc.tenderly.co/9351a25c-a4fe-452b-86b5-ed87acd05ce8',
    escrow: '0x8fC5337902A1EF5e699B2C19f1EBe892E5DBf294',
    settlement: '0x615807920BEA0751AbE4682f18b55C0e1BaA0112',
    proofVerifier: '0x73416Bc510C031708558F4f8796214A29e2FFdb7',
    wldToken: {
      symbol: 'WLD',
      address: '0x2cfc85d8e48f8eab294be644d9e25c3030863003',
    },
    nativeToken: {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    tradingPairs: ['WLD/ETH', 'WLD/USDC'], // WLD-based pairs
  },
} as const;

export type ChainType = keyof typeof CHAIN_CONFIG;
