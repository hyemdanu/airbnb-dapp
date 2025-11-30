// connects to ganache without metamask

import Web3 from 'web3';

const GANACHE_URL = 'http://127.0.0.1:8545';

const ACCOUNT_NAMES = [
  'Account 0 (Guest)',
  'Account 1 (Host Bob)',
  'Account 2 (Host Charlie)',
  'Account 3 (Admin)',
  'Account 4 (Extra)',
  'Account 5',
  'Account 6',
  'Account 7',
  'Account 8',
  'Account 9'
];

// deterministic private keys from ganache
const DETERMINISTIC_KEYS = {
  '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1': '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
  '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0': '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
  '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b': '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
  '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d': '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913',
  '0xd03ea8624C8C5987235048901fB614fDcA89b117': '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743',
  '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC': '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd',
  '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9': '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52',
  '0x28a8746e75304c0780E011BEd21C72cD78cd535E': '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3',
  '0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E': '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4',
  '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e': '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
};

let ganacheAccounts = [];
let currentAccountIndex = parseInt(localStorage.getItem('demoWalletAccountIndex') || '0');
let web3Instance = null;
let transactionLogger = null;

export const setTransactionLogger = (logger) => {
  transactionLogger = logger;
};

export const createWeb3 = () => {
  if (!web3Instance) {
    web3Instance = new Web3(GANACHE_URL);
  }
  return web3Instance;
};

export const fetchAccountsFromGanache = async () => {
  try {
    const web3 = createWeb3();
    const addresses = await web3.eth.getAccounts();
    const accounts = [];

    for (let i = 0; i < addresses.length && i < 10; i++) {
      const address = addresses[i];
      const balance = await web3.eth.getBalance(address);
      const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether'));
      const checksumAddress = web3.utils.toChecksumAddress(address);
      const privateKey = DETERMINISTIC_KEYS[checksumAddress] || null;

      accounts.push({
        address: checksumAddress,
        privateKey,
        name: ACCOUNT_NAMES[i] || 'Account ' + i,
        balance: balanceEth,
        isUnlocked: true
      });
    }

    ganacheAccounts = accounts;

    console.log('Ganache accounts loaded:');
    accounts.forEach((acc) => {
      console.log('  ' + acc.name + ': ' + acc.address + ' (' + acc.balance.toFixed(2) + ' ETH)');
    });

    return accounts;
  } catch (err) {
    console.log('Error fetching accounts: ' + err.message);
    return [];
  }
};

export const getGanacheAccounts = () => ganacheAccounts;
export const GANACHE_ACCOUNTS = ganacheAccounts;

export const getCurrentAccount = () => ganacheAccounts[currentAccountIndex] || null;
export const getCurrentAddress = () => ganacheAccounts[currentAccountIndex]?.address || null;

export const switchAccount = (index) => {
  if (index >= 0 && index < ganacheAccounts.length) {
    const oldAccount = ganacheAccounts[currentAccountIndex];
    currentAccountIndex = index;
    localStorage.setItem('demoWalletAccountIndex', index.toString());
    const newAccount = ganacheAccounts[currentAccountIndex];
    console.log('Account switch: ' + (oldAccount?.name || 'none') + ' -> ' + newAccount.name);
    return newAccount;
  }
  return null;
};

export const getAllAccounts = () => ganacheAccounts;

export const getBalance = async (web3, address) => {
  try {
    const balanceWei = await web3.eth.getBalance(address);
    return parseFloat(web3.utils.fromWei(balanceWei, 'ether'));
  } catch (err) {
    console.log('Error getting balance: ' + err.message);
    return 0;
  }
};

export const createContract = (web3, abi, address) => {
  const contract = new web3.eth.Contract(abi, address);
  const originalMethods = contract.methods;

  return {
    ...contract,
    methods: new Proxy(originalMethods, {
      get(target, prop) {
        const method = target[prop];
        if (typeof method === 'function') {
          return (...args) => {
            const tx = method(...args);
            const originalSend = tx.send.bind(tx);

            tx.send = async (options = {}) => {
              const account = getCurrentAccount();
              if (!account) {
                throw new Error('No account selected');
              }

              options.from = account.address;

              if (!options.gas) {
                try {
                  options.gas = await tx.estimateGas({ from: account.address, value: options.value });
                } catch (err) {
                  options.gas = 3000000;
                }
              }

              console.log('Sending transaction: ' + prop);
              console.log('  From: ' + account.address);
              console.log('  To: ' + address);
              console.log('  Gas: ' + options.gas);
              if (options.value) console.log('  Value: ' + options.value);

              let receipt;
              if (account.privateKey) {
                const gasPrice = await web3.eth.getGasPrice();
                const txData = {
                  from: account.address,
                  to: address,
                  data: tx.encodeABI(),
                  gas: options.gas,
                  gasPrice: gasPrice,
                  value: options.value || '0'
                };

                const signedTx = await web3.eth.accounts.signTransaction(txData, account.privateKey);
                receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
              } else {
                receipt = await originalSend(options);
              }

              console.log('Transaction complete:');
              console.log('  Hash: ' + receipt.transactionHash);
              console.log('  Block: ' + receipt.blockNumber);
              console.log('  Gas used: ' + receipt.gasUsed);

              if (transactionLogger) {
                transactionLogger({
                  type: 'contract',
                  method: prop,
                  from: account.address,
                  to: address,
                  value: options.value,
                  gasUsed: receipt.gasUsed?.toString(),
                  txHash: receipt.transactionHash,
                  blockNumber: receipt.blockNumber?.toString(),
                  status: receipt.status ? 'success' : 'failed'
                });
              }

              return receipt;
            };

            return tx;
          };
        }
        return method;
      }
    }),
    options: contract.options
  };
};

export const checkGanacheConnection = async () => {
  try {
    const web3 = createWeb3();
    const networkId = await web3.eth.net.getId();
    const blockNumber = await web3.eth.getBlockNumber();

    console.log('Connected to Ganache');
    console.log('  Network ID: ' + networkId);
    console.log('  Block: ' + blockNumber);
    console.log('  URL: ' + GANACHE_URL);

    await fetchAccountsFromGanache();

    return { connected: true, networkId, blockNumber, accounts: ganacheAccounts };
  } catch (err) {
    console.log('Cannot connect to Ganache at ' + GANACHE_URL);
    console.log('Run: ganache --deterministic --port 8545');
    return { connected: false, error: err.message };
  }
};

if (typeof window !== 'undefined') {
  window.demoWallet = {
    getGanacheAccounts,
    getCurrentAccount,
    getCurrentAddress,
    switchAccount,
    getAllAccounts,
    checkGanacheConnection,
    fetchAccountsFromGanache
  };
}
