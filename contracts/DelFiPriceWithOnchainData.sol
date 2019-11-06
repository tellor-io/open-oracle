pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./OpenOraclePriceData.sol";
import "./OpenOracleView.sol";
import "./OpenOracleOnChainInterface.sol";

/**
 * @notice The DelFi Price Feed View
 * @author Compound Labs, Inc.
 */
contract DelFiPriceWithOnchainData is OpenOracleView {

    /**
     * @notice The fundamental unit of storage for the on-chain source
     */
    struct Datum {
        uint64 timestamp;
        uint64 value;
    }
    mapping(address => mapping(string => Datum)) private onChainData;
    /**
     * @notice The list(array) of onChainSources contract addresses
     */
    address[] onChainSources;
    uint public duration; //how long prices are good for

    /**
     * @notice The mapping of medianized prices per symbol
     */
    mapping(string => uint64) public prices;
    /**
     * @notice The event emitted when a price is written to storage
     */
    event Price(string symbol, uint64 price);

    /**
     * @dev Specify the OpenOraclePriceData address, addresses for approved off-chain and on-chain data providers.
     * @param data_ is the address for the OpenOraclePriceData contract
     * @param sources_ is the list of authorized addresses to provide/sign off-chain data
     * @param onChainSources_ is the list of authorized on-chain souces addresses 
     */
    constructor(OpenOraclePriceData data_, address[] memory sources_,address[] memory onChainSources_, uint _duration) public OpenOracleView(data_, sources_) {
        onChainSources = onChainSources_;
        duration = _duration;
    }

    /**
     * @notice Allows users to get median price data
     * @param _symbol is the price symbol such as 'ETH/USD' etc...
     */
    function getPrice(string memory _symbol) public view returns(uint64){
        return prices[_symbol];
    }

    /**
     * @notice Primary entry point to post and recalculate prices
     * @dev We let anyone pay to post anything, but only sources count for prices.
     * @param messages The messages to post to the oracle
     * @param signatures The signatures for the corresponding messages
     */
    function postPrices(bytes[] calldata messages, bytes[] calldata signatures, string[] calldata symbols) external {
        require(messages.length == signatures.length, "messages and signatures must be 1:1");
        // Post the messages, whatever they are
        for (uint ii = 0; ii < messages.length; ii++) {
            OpenOraclePriceData(address(data)).put(messages[ii], signatures[ii]);
        }
        for (uint i = 0; i < symbols.length; i++) {
            string memory symbol = symbols[i];
            updateOnChainPrice(symbol);
            uint64 price = medianPrice(symbol);
            prices[symbol] = price;
            emit Price(symbol, price);
        }
    }

    function postOnChainPrices(string[] memory symbols) public {
            for (uint i = 0; i < symbols.length; i++) {
                string memory symbol = symbols[i];
                updateOnChainPrice(symbol);
                uint64 price = medianPrice(symbol);
                prices[symbol] = price;
                emit Price(symbol, price);
            }
    }

    event Print(string _s, uint _v);
    function updateOnChainPrice(string memory symbol) internal {
            bool _didGet;
            uint _retrievedValue;
            uint _timestampRetrieved;
            for(uint j=0; j< onChainSources.length; j++){
                (_didGet,_retrievedValue,_timestampRetrieved) = OpenOracleOnChainInterface(address(onChainSources[j])).getCurrentValue(symbol);   
                if(_didGet){//or a different threshold ( && _timestampRetrieved > now - 1 days .. or none like Compound)
                    onChainData[onChainSources[j]][symbol] = Datum({
                        value: uint64(_retrievedValue),
                        timestamp: uint64(_timestampRetrieved)
                    });
                emit Print("updated Onchain",_retrievedValue);
                }         
            }
    }
    /**
     * @notice Calculates the median price over any set of sources
     * @param symbol The symbol to calculate the median price of
     * @return median The median price over the set of sources
     */
    function medianPrice(string memory symbol) public view returns (uint64 median) {
        // Calculate the median price, write to storage, and emit an event
        //we need to have a timestamp restriction (updated within last X...)
        uint64[] memory postedPrices = new uint64[](sources.length + onChainSources.length);
        uint64 _t;
        uint64 _v;
        uint _updatedSources;
        for (uint i = 0; i <sources.length + onChainSources.length; i++){
            if(i < sources.length){
                (_t,_v) = OpenOraclePriceData(address(data)).get(sources[i], symbol);
                if (_t > now - duration){
                    postedPrices[_updatedSources] =_v;
                    _updatedSources++;
                }
            }
            else{
                /*(_t,_v) = getOnChain(onChainSources[i-sources.length], symbol);
                if (_t > now - duration){
                    postedPrices[_updatedSources] = _v;
                    _updatedSources++;
                }*/
            }
        }
        //resize array for sorting
        uint64[] memory allPrices = new uint64[](_updatedSources);
        for (uint i=0; i < (_updatedSources); i++) {
                allPrices[i] = postedPrices[i];
        }
        uint64[] memory sortedPrices = sort(allPrices);
        //what do we return if all things are old?  0 or the previous price?
        return sortedPrices[allPrices.length / 2];
        return 10;
    }

    /**
     * @notice Helper to sort an array of uints
     * @param array Array of integers to sort
     * @return The sorted array of integers
     */
    function sort(uint64[] memory array) private pure returns (uint64[] memory) {
        uint N = array.length;
        for (uint i = 0; i < N; i++) {
            for (uint j = i + 1; j < N; j++) {
                if (array[i] > array[j]) {
                    uint64 tmp = array[i];
                    array[i] = array[j];
                    array[j] = tmp;
                }
            }
        }
        return array;
    }

    /**
     * @notice Read a single key from an authenticated source
     * @param source The verifiable author of the data
     * @param key The selector for the value to return
     * @return The claimed Unix timestamp for the data and the price value (defaults to (0, 0))
     */
    function getOnChain(address source, string memory key) public view returns (uint64, uint64) {
        Datum storage datum = onChainData[source][key];
        return (datum.timestamp, datum.value);
    }

    /**
     * @notice Read only the value for a single key from an authenticated source
     * @param source The verifiable author of the data
     * @param key The selector for the value to return
     * @return The price value (defaults to 0)
     */
    function getOnChainPrice(address source, string calldata key) external view returns (uint64) {
        return onChainData[source][key].value;
    }
}