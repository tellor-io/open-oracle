pragma solidity ^0.5.0;

/**
 * @title OpenOracleOnChainImplementation 
 * @notice This is an example contract of a base oracle solely intended for 
 * testing purposes
 * @author Tellor Inc.
 */
contract OpenOracleOnChainImplementation{
    
    /**
     * @notice The fundamental unit of storage for the on-chain source
     */
    struct Datum {
        uint64 timestamp;
        uint64 value;
    }

    /**
     * @notice The mapping of symbol to current time available for it
     */
    mapping(string => uint64) public currentTime;

    /**
     * @notice The mapping of symbol to timestamp to Datum struct containing
     * the timestamp and value
     */
    mapping(string => mapping(uint64 => Datum)) public priceData;

	/*
	 * @notice Allows user to get the current data available for the specified symbol
	 * @param _symbol is the price symbol such as 'ETH/USD' etc...
	 * @returns _didGet as true if it was successful at retreiving current value,
	 * _value retreived, and _timestampRetrieved
	 */
	function getCurrentValue(string memory _symbol) public returns(bool _didGet,uint64 _value,uint64 _time){
		(_value,_time) = getValue(_symbol,currentTime[_symbol]);
		if(_time > 0){
			_didGet = true;
		}
	} 

	/*
	 * @notice Allows party to enter the current data available for the specified symbol
	 * @param _symbol is the price symbol such as 'ETH/USD' etc...
	 * @param _time is the timestamp correspoding to the value
	 * @param _value for timestamp and symbol
	 */
	function setValue(string calldata _symbol, uint64 _time, uint64 _value) external{
			priceData[_symbol][_time] = Datum({
				value: _value,
				timestamp: _time
            });
            if(_time > currentTime[_symbol]){
            	currentTime[_symbol] = _time;
            }
	}

	/*
	 * @notice Allows user to get the data for the specified symbol and time
	 * @param _symbol is the price symbol such as 'ETH/USD' etc...
	 * @param _timestamp is the timestamp correspoding to the value
	 * @returns _value for timestamp and symbol, and timestamp of value
	 */
	function getValue(string memory _symbol, uint64 _timestamp)public view returns(uint64,uint64){
		Datum storage thisVal = priceData[_symbol][_timestamp];
		return (thisVal.value,thisVal.timestamp);
	}
}