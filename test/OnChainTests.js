/*Tellor Open Oracle Tests*/

/*
Todo:
Add comments to everything
Add back into Compound structure w/Tests
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

async function postPricesWithOnchain(timestamp, priceses, symbols, signers = sources) {
    const messages = [], signatures = [];
    priceses.forEach((prices, i) => {
      const signed = helper.sign(helper.encode('prices', timestamp, prices.map(([symbol, price]) => [symbol, price])), signers[i].privateKey);
      for (let {message, signature, signatory} of signed) {
        expect(signatory).equal(signers[i].address);
        messages.push(message);
        signatures.push(signature);
      }
    });
    return [messages, signatures, symbols];
  }

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
      delfiPriceOnChain = await DelFiPriceWithOnchainData.new(openOraclePriceData.address,sources.map(a => a.address),[onChainData.address,onChainData2.address],86400);
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
       // console.log("setViewContract");
        sdate = Date.now()/1000- (Date.now()/1000)%86400;       
        //console.log("sdate", sdate)
        await onChainData.setValue(testSymbol, sdate, 200);
        //console.log("start value set");
        await testContract.startContract(86400);
        //console.log("contract started");
        let _start = await testContract.startDateTime.call();
        assert(await testContract.startDateTime.call() != 0 , "Contract should be started and startDateTime should not be 0") ;
    });

    it("Start and Settle Contract with OnChain prices", async function(){
        await testContract.setViewContract(delfiPriceOnChain.address, delfiPrice.address)
        assert.equal(await testContract.viewAddress.call(),delfiPriceOnChain.address,"the onchain address should be correctly set in the Test Contract");
        //Set Value on chain for today
        sdate = Date.now()/1000- (Date.now()/1000)%86400;//start date to initiate derivatives contract       
        await onChainData.setValue(testSymbol, sdate, 290); //setValue for onChain oracle for start date
        let svalue = await onChainData.getValue(testSymbol, sdate)//view value
        var forpostPrices = await postPricesWithOnchain(sdate, [
          [
            ['ETH/USD', 290]
          ],
          [['ETH/USD', 291]],
          [['ETH/USD', 292]],
          [['ETH/USD', 293]],
          [['ETH/USD', 294]]
          ], ['ETH/USD']);
        await delfiPriceOnChain.postPrices(forpostPrices[0], forpostPrices[1], forpostPrices[2])
        //initiate test contract today
        await testContract.startContract(86400*2);//start derivatives contract with two day duration
        //check start value is not zero
        svalue = await testContract.startValue.call()  //view start value 
        // assert(await web3.utils.hexToNumberString(startValue) != 0, "should not be zero, shoudl be 290") 
        let _start = await testContract.startDateTime.call();
        // assert(await testContract.startDateTime.call() != 0 , "Contract should be started") ;
        _enddate = await helper.advanceTime(86400 * 3);
        // console.log('_enddate', _enddate);
        // console.log("time travel");
        // edate = sdate + (86400*3);       
        // console.log("edate", edate)
        let _end = await testContract.endDateTime.call();
        await onChainData.setValue(testSymbol, _end, 3e11);

        var forpostPrices = await postPricesWithOnchain(sdate + (86400*3), [
          [
            ['ETH/USD', 1290]
          ],
          [['ETH/USD', 1291]],
          [['ETH/USD', 1292]],
          [['ETH/USD', 1293]],
          [['ETH/USD', 1294]]
          ], ['ETH/USD']);

        await delfiPriceOnChain.postPrices(forpostPrices[0], forpostPrices[1], forpostPrices[2])
        await testContract.settleContracts();
        evalue = await testContract.endValue.call()
        // console.log("contract settled");
        assert(evalue-svalue > 0, "endValue should be greater than start value")
        assert.equal(await testContract.contractEnded.call(), true, "True if contract was settled");
    });
        it("Post Prices 2 off chain, 3 on chain, check median in between", async function(){   
          sdate = Date.now()/1000- (Date.now()/1000)%86400;
        await onChainData.setValue(testSymbol, sdate, 290); //setValue for onChain oracle for start date
        let svalue = await onChainData.getValue(testSymbol, sdate)//view value
        await delfiPriceOnChain.postOnChainPrices([testSymbol]);
        var forpostPrices = await postPricesWithOnchain(sdate, [
          [['ETH/USD', 290]],
          [['ETH/USD', 291]],
          [['ETH/USD', 292]],
          [['ETH/USD', 293]],
          [['ETH/USD', 294]]
          ], ['ETH/USD']);
        await delfiPriceOnChain.postPrices(forpostPrices[0], forpostPrices[1], forpostPrices[2])
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),291, "Median 1 should be correct");
        await onChainData.setValue(testSymbol, sdate, 297); //setValue for onChain oracle for start date
                await delfiPriceOnChain.postOnChainPrices([testSymbol]);
        await delfiPriceOnChain.postOnChainPrices(['ETH/USD'])
        assert.equal(await delfiPriceOnChain.getOnChainPrice(onChainData.address,'ETH/USD'),297, "Onchain get should work");
        var data = await delfiPriceOnChain.getOnChainPrice(onChainData.address,'ETH/USD');
        assert(data[0] > 0, "Onchain get timestamp should work");
        assert(data[1] > 0, "Onchain get value should work");
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),292, "Median 2 should be correct");
        onChainData2.setValue(testSymbol,sdate,200);
                await delfiPriceOnChain.postOnChainPrices([testSymbol]);
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),291, "Median 3 should be correct");
        await onChainData.setValue(testSymbol, sdate, 0);
        var forpostPrices = await postPricesWithOnchain(sdate + (86400*3), [
          [['ETH/USD', 1290]],
          [['ETH/USD', 1291]],
          [['ETH/USD', 1292]],
          [['ETH/USD', 1293]],
          [['ETH/USD', 1294]]
          ], ['ETH/USD']);

        await delfiPriceOnChain.postPrices(forpostPrices[0], forpostPrices[1], forpostPrices[2])
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),1291, "Median 4 should be correct");
    });
      it("Checking duration enforcing", async function(){   
        assert.equal(await delfiPriceOnChain.duration.call(), 86400, "Duration should be correct"); 
         sdate = Date.now()/1000- (Date.now()/1000)%86400;
        await onChainData.setValue(testSymbol, sdate, 290); //setValue for onChain oracle for start date
        let svalue = await onChainData.getValue(testSymbol, sdate)//view value
        var forpostPrices = await postPricesWithOnchain(sdate, [
          [['ETH/USD', 290]],
          [['ETH/USD', 291]],
          [['ETH/USD', 292]],
          [['ETH/USD', 293]],
          [['ETH/USD', 294]]
          ], ['ETH/USD']);
        await delfiPriceOnChain.postPrices(forpostPrices[0], forpostPrices[1], forpostPrices[2])
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),await delfiPriceOnChain.medianPrice('ETH/USD'), "Median price works"); 
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),291, "Median 1 should be correct");
        await helper.advanceTime(86400 * 3);
        await onChainData.setValue(testSymbol, sdate, 280); //setValue for onChain oracle for start date
        await onChainData2.setValue(testSymbol, sdate, 270); //setValue for onChain oracle for start date
                await delfiPriceOnChain.postOnChainPrices([testSymbol]);
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),270,  "Median should only have current prices be correct"); 
                await helper.advanceTime(86400 * 3);
        var forpostPrices = await postPricesWithOnchain(sdate, [
          [['ETH/USD', 1290]],
          [['ETH/USD', 1291]],
          [['ETH/USD', 1292]],
          [['ETH/USD', 1293]],
          [['ETH/USD', 1294]]
          ], ['ETH/USD']);
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),await delfiPriceOnChain.medianPrice('ETH/USD'), "Median price differs"); 
                await delfiPriceOnChain.postOnChainPrices([testSymbol]);
        assert.equal(await delfiPriceOnChain.getPrice('ETH/USD'),1292, "Median should only have current prices 2"); 



    });

});    