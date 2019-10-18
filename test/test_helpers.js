advanceTimeAndBlock = async (time) => {
    await advanceTime(time);
    await advanceBlock();
    console.log('Time Travelling...');
    return Promise.resolve(web3.eth.getBlock('latest'));
}

advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
        });
    });
}

advanceBlock = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
        }, (err, result) => {
            if (err) { return reject(err); }
            const newBlockHash = web3.eth.getBlock('latest').hash;

            return resolve(newBlockHash)
        });
    });
}

/*function promisifyLogWatch(_contract,_event) {
  return new Promise((resolve, reject) => {
    web3.eth.subscribe('logs', {
      address: _contract.options.address,
      topics:  ['0xc12a8e1d75371aee68708dbc301ab95ef7a6022cd0eda54f8669aafcb77d21bd']
    }, (error, result) => {
        console.log('Result',result);
        console.log('Error',error);
        if (error)
          reject(error);
        web3.eth.clearSubscriptions();
        resolve(result);
    })
  });
}*/

async function expectThrow(promise){
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(
      invalidOpcode || outOfGas || revert,
      'Expected throw, got \'' + error + '\' instead',
    );
    return;
  }
  assert.fail('Expected throw not received');
};



function getKeyAndValueType(kind) {
    switch (kind) {
        case 'prices':
            return ['symbol', 'decimal'];
        default:
            throw new Error(`Unknown kind of data "${kind}"`);
    }
}
function fancyParameterDecoder(paramType) {
    let actualParamType = paramType, actualParamDec = (x) => x;
    if (paramType == 'decimal') {
        actualParamType = 'uint64';
        actualParamDec = (x) => x / 1e6;
    }
    if (paramType == 'symbol') {
        actualParamType = 'string';
        actualParamDec = (x) => x; // we don't know what the original case was anymore
    }
    return [actualParamType, actualParamDec];
}
function decode(kind, messages) {
    const [keyType, valueType] = getKeyAndValueType(kind);
    const [kType, kDec] = fancyParameterDecoder(keyType);
    const [vType, vDec] = fancyParameterDecoder(valueType);
    return messages.map((message) => {
        const { 0: kind_, 1: timestamp, 2: key, 3: value } = web3.eth.abi.decodeParameters(['string', 'uint64', kType, vType], message);
        if (kind_ != kind)
            throw new Error(`Expected data of kind ${kind}, got ${kind_}`);
        return [timestamp, key, value];
    });
}
function fancyParameterEncoder(paramType) {
    let actualParamType = paramType, actualParamEnc = (x) => x;
    // We add a decimal type for reporter convenience.
    // Decimals are encoded as uints with 18 decimals of precision on-chain.
    if (paramType === 'decimal') {
        actualParamType = 'uint64';
        actualParamEnc = (x) => web3.utils.toBN(1e6).muln(x).toString();
    }
    if (paramType == 'symbol') {
        actualParamType = 'string';
        //actualParamEnc = (x) => x.toUpperCase();
        actualParamEnc = (x) => x;
    }
    return [actualParamType, actualParamEnc];
}
function encode(kind, timestamp, pairs) {
    const [keyType, valueType] = getKeyAndValueType(kind);
    const [kType, kEnc] = fancyParameterEncoder(keyType);
    const [vType, vEnc] = fancyParameterEncoder(valueType);
    const actualPairs = Array.isArray(pairs) ? pairs : Object.entries(pairs);
    return actualPairs.map(([key, value]) => {
        return web3.eth.abi.encodeParameters(['string', 'uint64', kType, vType], [kind, timestamp, kEnc(key), vEnc(value)]);
    });
}

function sign(messages, privateKey) {
    const actualMessages = Array.isArray(messages) ? messages : [messages];
    return actualMessages.map((message) => {
        const hash = web3.utils.keccak256(message);
        const { r, s, v } = web3.eth.accounts.sign(hash, privateKey);
        const signature = web3.eth.abi.encodeParameters(['bytes32', 'bytes32', 'uint8'], [r, s, v]);
        const signatory = web3.eth.accounts.recover(hash, v, r, s);
        return { hash, message, signature, signatory };
    });
}



module.exports = {
    advanceTime,
    advanceBlock,
    advanceTimeAndBlock,
    expectThrow,
    encode,
    sign
}





