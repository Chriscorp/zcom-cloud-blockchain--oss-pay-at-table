pragma solidity ^0.4.8;

import './ERC20Interface.sol';

contract PayAtTable {

    mapping(address => uint) public nonces;

    struct Store {
        address[] allowTokens;
        mapping(bytes32 => Receipt) receipts;
    }

    struct Receipt {
        address token;
        mapping(address => uint) paidAmounts;
        address[] payers;
    }

    mapping(address => Store) stores;

    event AllowToken(address indexed _storeAddress, address _allowToken, bool _isAdded);
    event Pay(address indexed _storeAddress, bytes32 indexed _receiptId, address _payer, address _tokenAddress, uint _amount);
    event Refund(address indexed _storeAddress, bytes32 indexed _receiptId);

    function addAllowToken(address _tokenAddress) returns (bool success) {
        return addAllowTokenPrivate(msg.sender, _tokenAddress);
    }

    function addAllowTokenWithSign(address _tokenAddress, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('addAllowTokenWithSign');
        hash = sha3(hash, _tokenAddress);
        hash = sha3(hash, _nonce);
        address storeAddress = recoverAddress(hash, _sign);

        if (nonces[storeAddress] == _nonce && addAllowTokenPrivate(storeAddress, _tokenAddress)) {
            nonces[storeAddress]++;
            return true;
        }
        return false;
    }

    function addAllowTokenPrivate(address _storeAddress, address _tokenAddress) private returns (bool success) {
        for (uint i = 0; i < stores[_storeAddress].allowTokens.length; i++) {
            if (stores[_storeAddress].allowTokens[i] == _tokenAddress) return false;
        }
        stores[_storeAddress].allowTokens.push(_tokenAddress);
        AllowToken(_storeAddress, _tokenAddress, true);
        return true;
    }

    function removeAllowToken(address _tokenAddress) returns (bool success) {
        return removeAllowTokenPrivate(msg.sender, _tokenAddress);
    }

    function removeAllowTokenWithSign(address _tokenAddress, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('removeAllowTokenWithSign');
        hash = sha3(hash, _tokenAddress);
        hash = sha3(hash, _nonce);
        address storeAddress = recoverAddress(hash, _sign);

        if (nonces[storeAddress] == _nonce && removeAllowTokenPrivate(storeAddress, _tokenAddress)) {
            nonces[storeAddress]++;
            return true;
        }
        return false;
    }

    function removeAllowTokenPrivate(address _storeAddress, address _tokenAddress) private returns (bool success) {
        for (uint i = 0; i < stores[_storeAddress].allowTokens.length; i++) {
            if (stores[_storeAddress].allowTokens[i] == _tokenAddress) {
                stores[_storeAddress].allowTokens[i] = stores[_storeAddress].allowTokens[stores[_storeAddress].allowTokens.length - 1];
                stores[_storeAddress].allowTokens.length--;
                AllowToken(_storeAddress, _tokenAddress, false);
                return true;
            }
        }
        return false;
    }

    function pay(address _storeAddress, bytes32 _receiptId, address _tokenAddress, uint _amount) returns (bool success) {
        return payPrivate(msg.sender, _storeAddress, _receiptId, _tokenAddress, _amount);
    }

    function payWithSign(address _storeAddress, bytes32 _receiptId, address _tokenAddress, uint _amount, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('payWithSign');
        hash = sha3(hash, _storeAddress);
        hash = sha3(hash, _receiptId);
        hash = sha3(hash, _tokenAddress);
        hash = sha3(hash, _amount);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (nonces[from] == _nonce && payPrivate(from, _storeAddress, _receiptId, _tokenAddress, _amount)) {
            nonces[from]++;
            return true;
        }
        return false;
    }

    function payPrivate(address _from, address _storeAddress, bytes32 _receiptId, address _tokenAddress, uint _amount) private returns (bool success) {
        if (!isAllowToken(_storeAddress, _tokenAddress)) return false;
        uint amount;
        if (stores[_storeAddress].receipts[_receiptId].token == 0) {
            amount = _amount;
            address[] memory payers = new address[](1);
            payers[0] = _from;
            stores[_storeAddress].receipts[_receiptId] = Receipt({token: _tokenAddress, payers: payers});
            stores[_storeAddress].receipts[_receiptId].paidAmounts[_from] = amount;
        } else {
            if (stores[_storeAddress].receipts[_receiptId].token != _tokenAddress || _amount <= getTotalAmount(_storeAddress, _receiptId)) return false;
            amount = _amount - getTotalAmount(_storeAddress, _receiptId);
            if (stores[_storeAddress].receipts[_receiptId].paidAmounts[_from] == 0) stores[_storeAddress].receipts[_receiptId].payers.push(_from);
            stores[_storeAddress].receipts[_receiptId].paidAmounts[_from] += amount;
        }
        Pay(_storeAddress, _receiptId, _from, _tokenAddress, amount);
        return ERC20Interface(_tokenAddress).transferFrom(_from, _storeAddress, amount);
    }

    function refund(bytes32 _receiptId) returns (bool success) {
        return refundPrivate(msg.sender, _receiptId);
    }

    function refundWithSign(bytes32 _receiptId, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('refundWithSign');
        hash = sha3(hash, _receiptId);
        hash = sha3(hash, _nonce);
        address storeAddress = recoverAddress(hash, _sign);

        if (nonces[storeAddress] == _nonce && refundPrivate(storeAddress, _receiptId)) {
            nonces[storeAddress]++;
            return true;
        }
        return false;
    }

    function refundPrivate(address _storeAddress, bytes32 _receiptId) private returns (bool success) {
        address tokenAddress = stores[_storeAddress].receipts[_receiptId].token;
        for (uint i = 0; i < stores[_storeAddress].receipts[_receiptId].payers.length; i++) {
            address payer = stores[_storeAddress].receipts[_receiptId].payers[i];
            assert(ERC20Interface(tokenAddress).transferFrom(_storeAddress, payer, stores[_storeAddress].receipts[_receiptId].paidAmounts[payer]));
            stores[_storeAddress].receipts[_receiptId].paidAmounts[payer] = 0;
        }
        stores[_storeAddress].receipts[_receiptId].payers.length = 0;
        stores[_storeAddress].receipts[_receiptId].token = 0;
        Refund(_storeAddress, _receiptId);
        return true;
    }

    function calcEnvHash(bytes32 _functionName) constant returns (bytes32 hash) {
        hash = sha3(this);
        hash = sha3(hash, _functionName);
    }

    function recoverAddress(bytes32 _hash, bytes _sign) constant returns (address recoverdAddr) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        assert(_sign.length == 65);

        assembly {
            r := mload(add(_sign, 32))
            s := mload(add(_sign, 64))
            v := byte(0, mload(add(_sign, 96)))
        }

        if (v < 27) v += 27;
        assert(v == 27 || v == 28);

        recoverdAddr = ecrecover(_hash, v, r, s);
        assert(recoverdAddr != 0);
    }

    function getTotalAmount(address _storeAddress, bytes32 _receiptId) constant returns (uint total) {
        for (uint i = 0; i < stores[_storeAddress].receipts[_receiptId].payers.length; i++) {
            total += stores[_storeAddress].receipts[_receiptId].paidAmounts[stores[_storeAddress].receipts[_receiptId].payers[i]];
        }
    }

    function getTokenAddress(address _storeAddress, bytes32 _receiptId) constant returns (address tokenAddress) {
        return stores[_storeAddress].receipts[_receiptId].token;
    }

    function isAllowToken(address _storeAddress, address _tokenAddress) constant returns (bool success) {
        for (uint i = 0; i < stores[_storeAddress].allowTokens.length; i++) {
            if (stores[_storeAddress].allowTokens[i] == _tokenAddress) return true;
        }
        return false;
    }

    function getAllowTokensLength(address _storeAddress) constant returns (uint length) {
        return stores[_storeAddress].allowTokens.length;
    }

    function getAllowToken(address _storeAddress, uint _index) constant returns (address tokenAddress) {
        return stores[_storeAddress].allowTokens[_index];
    }

    function getPayersLength(address _storeAddress, bytes32 _receiptId) constant returns (uint length) {
        return stores[_storeAddress].receipts[_receiptId].payers.length;
    }

    function getPayer(address _storeAddress, bytes32 _receiptId, uint _index) constant returns (address payer) {
        return stores[_storeAddress].receipts[_receiptId].payers[_index];
    }

    function getPaidAmount(address _storeAddress, bytes32 _receiptId, address _payer) constant returns (uint amount) {
        return stores[_storeAddress].receipts[_receiptId].paidAmounts[_payer];
    }
}
