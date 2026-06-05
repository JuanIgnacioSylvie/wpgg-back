export const WPGG_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'rewardPlayer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
