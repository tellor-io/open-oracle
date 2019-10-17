/*Tellor Open Oracle Tests*/


/*
Todo:

Tests:
Launch Compound Open Oracle System
Launch Compound OpenOracle System w/onchain prices
Test Derivatives contract refering to Compound Oracle System
Test Derivatives Contract referring to C.O.S w/ Onchain data

Add comments to everything
Restructure pushPrices from onChain?
Remove all unnecessary files in repo 
Clean package.json
Update Readme

*/

/** 
* This tests the oracle functions, including mining.
*/
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));
const BN = require('bn.js');  
const helper = require("./test_helpers");
const TestContract = artifacts.require("./TestContract.sol");
const DelfiPrice = artifacts.require("./DelFiPrice.sol")
const DelFiPriceWithOnchainData = artifacts.require("./DelFiPriceWithOnchainData.sol")
const OpenOraclePriceData = artifacts.require("./OpenOraclePriceData.sol")
const OpenOracleData = artifacts.require("./OpenOraclePriceData.sol")
const OpenOracleOnChainImplementation = artifacts.require("./OpenOracleOnChainImplementation.sol"); 
const OpenOracleOnChainInterface = artifacts.require("./OpenOracleOnChainInterface.sol");


const sources = [
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf10',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf11',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf12',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf13',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf14',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf20',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf21',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf22',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf23',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf24',
].slice(0, 5).map(web3.eth.accounts.privateKeyToAccount);

const nonSources = [
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf15',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf16',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf17',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf18',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf19',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf25',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf26',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf27',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf28',
  '0x177ee777e72b8c042e05ef41d1db0f17f1fcb0e8150b37cfad6993e4373bdf29',
].slice(0, 5).map(web3.eth.accounts.privateKeyToAccount);

let testSymbol = 'ETH/USD'

contract('Open Oracle Tests', function(accounts) {
  let testContract;
  let delfiPrice;
  let openOraclePriceData;
  let delfiPriceOnChain;
  let onChainData;
  let onChainData2;

    beforeEach('Setup contract for each test', async function () {
      onChainData = await OpenOracleOnChainImplementation.new();
      onChainData2 = await OpenOracleOnChainImplementation.new();//Deployed two to test two "different" sources
      openOraclePriceData = await OpenOraclePriceData.new();
      delfiPrice = await DelfiPrice.new(openOraclePriceData.address,sources.map(a => a.address));
      delfiPriceOnChain = await DelFiPriceWithOnchainData.new(openOraclePriceData.address,sources.map(a => a.address),[onChainData.address,onChainData2.address]);
      testContract = await TestContract.new(testSymbol);
    });

    it("System Launched", async function(){
        await testContract.setViewContract(delfiPriceOnChain.address, delfiPrice.address)
        assert.equal(await testContract.viewAddress.call(),delfiPriceOnChain.address,"the onchain address should be correctly set in the Test Contract");
        assert.equal(await testContract.origAddress.call(),delfiPrice.address,"the offchain address should be correctly set in the Test Contract");
    });

    it("Initiate a test contract", async function(){
        await testContract.setViewContract(delfiPriceOnChain.address, delfiPrice.address)
        assert.equal(await testContract.viewAddress.call(),delfiPriceOnChain.address,"the onchain address should be correctly set in the Test Contract");
        console.log("setViewContract");
        sdate = Date.now()/1000- (Date.now()/1000)%86400;       
        console.log("sdate", sdate)
        await onChainData.setValue(testSymbol, sdate, 200);
        console.log("start value set");
        await testContract.startContract(86400);
        console.log("contract started");
        let _start = await testContract.startDateTime.call();
        console.log(web3.utils.hexToNumberString(_start))
        assert(await testContract.startDateTime.call() != 0 , "Contract should be started and startDateTime should not be 0") ;
    });

    it("Start and Settle Contract", async function(){
        await testContract.setViewContract(delfiPriceOnChain.address, delfiPrice.address)
        assert.equal(await testContract.viewAddress.call(),delfiPriceOnChain.address,"the onchain address should be correctly set in the Test Contract");
        console.log("setViewContract");

        //Set Value on chain for today
        sdate = Date.now()/1000- (Date.now()/1000)%86400;//start date to initiate derivatives contract       
        console.log("sdate", sdate)
        await onChainData.setValue(testSymbol, sdate, 2e11); //setValue for onChain oracle for start date
        let svalue = await onChainData.getValue(testSymbol, sdate)//view value
        console.log("value,times", web3.utils.hexToNumberString(svalue[0]), web3.utils.hexToNumberString(svalue[1]))
        // assert(await web3.utils.hexToNumberString(svalue[0]) == 2e11 , "should equal 2e11")
        // assert(await web3.utils.hexToNumberString(svalue[1]) == sdate , "should equal sdate") 

        //initiate test contract today
        await testContract.startContract(86400*2);//start derivatives contract with two day duration
        console.log("contract started");
        //check start value is not zero
        svalue = await testContract.startValue.call()  //view start value 
        console.log(svalue)
        console.log("svalue", web3.utils.hexToNumberString(svalue))
        // assert(await web3.utils.hexToNumberString(startValue) != 0, "should not be zero, shoudl be 2e11") 


        let _start = await testContract.startDateTime.call();
        console.log("startDateTime", web3.utils.hexToNumberString(_start))
        // assert(await testContract.startDateTime.call() != 0 , "Contract should be started") ;
        _enddate = await helper.advanceTime(86400 * 3);
        // console.log('_enddate', _enddate);
        // console.log("time travel");
        // edate = sdate + (86400*3);       
        // console.log("edate", edate)
        let _end = await testContract.endDateTime.call();
        console.log("endDateTime", web3.utils.hexToNumberString(_end))
        await onChainData.setValue(testSymbol, _end, 3e11);


        await testContract.settleContracts();
        evalue = await testContract.endValue.call()
        console.log("evalue", web3.utils.hexToNumberString(evalue))
        // console.log("contract settled");
        // assert.equal(await testContract.contractEnded.call(), true, "True if contract was settled");

    });

/*Launch Compound Open Oracle System
Launch Compound OpenOracle System w/onchain prices
Test Derivatives contract refering to Compound Oracle System
Test Derivatives Contract referring to C.O.S w/ Onchain data

Add comments to everything
Restructure pushPrices from onChain?
Remove all unnecessary files in repo 
Clean package.json
Update Readme*/

});    