pragma solidity ^0.5.0;

import './DelFiPriceWithOnchainData.sol';
import './DelFiPrice.sol';
/**
* @title Reader
* This contracts is a pretend contract using Tellor that compares two time values
*/
contract TestContract{
    
    /*Variables*/
	bool public longWins;
	bool public contractEnded;
	uint public startDateTime;
	uint public endDateTime;
	uint64 public startValue;
	uint64 public endValue;
    address public viewAddress;
    address public origAddress;
	string public symbol;
		
	DelFiPriceWithOnchainData viewContract;
	DelFiPrice origContract;

    /*Events*/
    event ContractSettled(uint64 _svalue, uint64 _evalue);

    /*Constructor*/
    /**
    * @dev set the symbol used by the test contract
    * @param _symbol is 
    */
	constructor(string memory _symbol) public {
		symbol = _symbol;
	}

    /*Functions*/
    /**
     * @dev sets the  DelFiPriceWIthOnChainData(viewContract)
     * @param _viewContract is the address for Compounds DelFiPriceWithOnChainData contract
     * @param _origContract is the address of Compounds original(no onChainData) DelFiPrice contract
     */
	function setViewContract(address _viewContract, address _origContract) public {
		viewContract = DelFiPriceWithOnchainData(_viewContract);
		viewAddress = _viewContract;
		origContract = DelFiPrice(_origContract);
		origAddress = _origContract;
	}

    event print(string _desc, uint _val);
    /**
     * @dev creates a start(now) and end time(now + duration specified) for testing a contract start and end period
     * @param _duration in seconds
     */
	function startContract(uint _duration) external {
		startDateTime = now - (now % 1 days);//test failing so added rounding to the day...
		emit print("start", startDateTime);
		endDateTime = startDateTime + _duration;
		emit print("end", endDateTime);
		startValue = viewContract.getPrice(symbol);
	}


	/**
     * @dev testing function that settles the contract by getting the first undisputed value after the startDateTime
     * and the first undisputed value after the end time of the contract and settleling(payin off) it.
	 */
	function settleContracts() external{
		require(now > endDateTime);
		endValue = viewContract.getPrice(symbol);
		if(endValue > startValue){
			longWins = true;
		}
		contractEnded = true;
		emit ContractSettled(startValue, endValue);
	}

	//add function to settle with original compound DelFiPrice meaning without on-chain component
}