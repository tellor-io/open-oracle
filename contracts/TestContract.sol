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

    /*Events*/
    event ContractSettled(uint64 _svalue, uint64 _evalue);

    /*Constructor*/
    /**
    * @notice Set the symbol used by the test contract
    * @param _symbol is the price symbol such as 'ETH/USD' etc...
    */
	constructor(string memory _symbol) public {
		symbol = _symbol;
	}

    /*Functions*/
    /**
     * @notice Sets the  DelFiPriceWIthOnChainData(viewContract)
     * @param _viewContract is the address for Compounds DelFiPriceWithOnChainData contract
     */
	function setViewContract(address _viewContract) public {
		viewContract = DelFiPriceWithOnchainData(_viewContract);
		viewAddress = _viewContract;
	}

    /**
     * @notice Creates a start(now) and end time(now + duration specified) for testing a contract start and end period
     * @param _duration of the contract in seconds
     */
	function startContract(uint _duration) external {
		startDateTime = now - (now % 1 days);//test failing so added rounding to the day...
		endDateTime = startDateTime + _duration;
		startValue = viewContract.getPrice(symbol);
	}


	/**
     * @notice Testing function that settles the contract by getting the first undisputed value after the startDateTime
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

}