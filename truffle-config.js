require('babel-polyfill');
require('babel-register');
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider-privkey')
const privateKeys = process.env.PRIVATE_KEYS || ""

module.exports = {
  
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
     },
     kovan:{
       provider: function(){
         return new HDWalletProvider( 
          privateKeys.split(','),
          //url to eth node
          `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`
         )
       },
       gas:5000000,
       gasPrice:250000000000,
       network_id:42
     }
  },
  contracts_directory:'./src/contracts/',
  contracts_build_directory:'./src/abis/',

  // Configure your compilers
  compilers: {
    solc: {
      //version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      optimizer: {
         enabled: true,
         runs: 200
       },
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled:
  // false to enabled: true. The default storage location can also be
  // overridden by specifying the adapter settings, as shown in the commented code below.
  //
  // NOTE: It is not possible to migrate your contracts to truffle DB and you should
  // make a backup of your artifacts to a safe location before enabling this feature.
  //
  // After you backed up your artifacts you can utilize db by running migrate as follows: 
  // $ truffle migrate --reset --compile-all
  //
  // db: {
    // enabled: false,
    // host: "127.0.0.1",
    // adapter: {
    //   name: "sqlite",
    //   settings: {
    //     directory: ".db"
    //   }
    // }
  // }
};
