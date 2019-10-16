/*Tellor Open Oracle Tests*/


/*Imports*/
const helper = require("./helpers/test_helpers");

const TellorTransfer = artifacts.require("./libraries/TellorTransfer.sol");
const TellorDispute = artifacts.require("./libraries/TellorDispute.sol");
const TellorStake = artifacts.require("./libraries/TellorStake.sol");
const TellorLibrary = artifacts.require("./libraries/TellorLibrary.sol");
const TellorGettersLibrary = artifacts.require("./libraries/TellorGettersLibrary.sol");
const Tellor = artifacts.require("./Tellor.sol");
const TellorMaster = artifacts.require("./TellorMaster.sol");
const masterMasterAbi = TellorMaster.abi;
const tellorAbi = Tellor.abi;

const UserContract = artifacts.require("UserContract");
const UsingTellor = artifacts.require("UsingTellor");
const Optimistic = artifacts.require("Optimistic");
const TestContract = artifacts.require("TestContract");
const UserContractAbi = UserContract.abi;

const DelFiPriceWithOnchainData = artifacts.require("DelFiPriceWithOnchainData");
const OpenOracleView = artifacts.require("OpenOracleView");
const OpenOracleOnChainInterface = artifacts.require("OpenOracleOnChainInterface");

const OpenOraclePriceData = artifacts.require("OpenOraclePriceData");
const OpenOracleData = artifacts.require("OpenOracleData");

/*Helper functions*/
function sleep_s(secs) {
  secs = (+new Date) + secs * 1000;
  while ((+new Date) < secs);
}

const Web3 = require('web3')
var HDWalletProvider = require("@truffle/hdwallet-provider");
var web3 = new Web3(new HDWalletProvider('3a10b4bc1258e8bfefb95b498fb8c0f0cd6964a811eabca87df5630bcacd7216',"https://rinkeby.infura.io/v3/7f11ed6df93946658bf4c817620fbced"));
//var web3 = new Web3(new HDWalletProvider("","https://mainnet.infura.io/v3/bc3e399903ae407fa477aa0854a00cdc"));

//Rinkeby
let tellorMasterAddress = '0x724D1B69a7Ba352F11D73fDBdEB7fF869cB22E19';

module.exports =async function(callback) {
let userContract;
let testContract;
let openOracle;
//Launch Tellor System
//(can we just import ABI's ?)
// Launch Tellor User Contract and Test Contract
    userContract = await UserContract.new(tellorMasterAddress);
    console.log('userContract address:', userContract.address);
    //let userContract = web3.eth.contract(UserContractAbi).at(userContract.address);
    testContract = await TestContract.new(userContract.address, 100, 86400*3, [2], 100);
    console.log('testContract address:', testContract.address);
//  Launch Compound Open Oracle System
    openOraclePriceData = await OpenOraclePriceData.new();
    console.log('openOraclePriceData address:', openOraclePriceData.address);
//  Link Tellor to Compound Oracle System(include the user contract on)
    delFiPriceWithOnchainData = await DelFiPriceWithOnchainData.new(openOraclePriceData.address, [],[userContract.address]);
    console.log('delFiPriceWithOnchainData address:', delFiPriceWithOnchainData.address);
// Test Derivatives contract refering to Compound Oracle System
// Link Optimistic Contract to Compound Oracle system
   //add fx to optimistic to pull from OpenOraclePriceData
    await testContract.testContract(86400*2);
    var startTime = await testContract.startDateTime.call();
    await helper.advanceTime(86400 * 2);


// Test Derivatives contract refering to Compound Oracle System

process.exit()

}