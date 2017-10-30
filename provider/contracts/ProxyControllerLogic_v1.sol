pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionLogic.sol';
import './ProxyController.sol';
import './TokenSample.sol';
import './PayAtTable.sol';

contract ProxyControllerLogic_v1 is VersionLogic, ProxyController {
    function ProxyControllerLogic_v1(ContractNameService _cns) VersionLogic (_cns, CONTRACT_NAME) {}

    function getSymbol(address _tokenAddress) constant returns (bytes32 symbol) {
        return TokenSample(_tokenAddress).symbol();
    }

    function getName(address _tokenAddress) constant returns (bytes32 name) {
        return TokenSample(_tokenAddress).name();
    }

    function getTotalSupply(address _tokenAddress) constant returns (uint totalSupply) {
        return TokenSample(_tokenAddress).totalSupply();
    }

    function getNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return TokenSample(_tokenAddress).nonceOf(_addr);
    }

    function getBalance(address _tokenAddress, address _addr) constant returns (uint balance) {
        return TokenSample(_tokenAddress).balanceOf(_addr);
    }

    function getAllowance(address _tokenAddress, address _holder, address _spender) constant returns (uint balance) {
        return TokenSample(_tokenAddress).allowance(_holder, _spender);
    }

    function approve(address _tokenAddress, address _spender, uint _amount, uint _nonce, bytes _sign) {
        assert(TokenSample(_tokenAddress).approveWithSign(_spender, _amount, _nonce, _sign));
    }

    function transfer(address _tokenAddress, address _to, uint _amount, uint _nonce, bytes _sign) {
        assert(TokenSample(_tokenAddress).transferWithSign(_to, _amount, _nonce, _sign));
    }


    function getPayAtTableNonce(address _payAtTable, address _addr) constant returns (uint nonce) {
        return PayAtTable(_payAtTable).nonces(_addr);
    }

    function addAllowToken(address _payAtTable, address _tokenAddress, uint _nonce, bytes _clientSign) {
        assert(PayAtTable(_payAtTable).addAllowTokenWithSign(_tokenAddress, _nonce, _clientSign));
    }

    function removeAllowToken(address _payAtTable, address _tokenAddress, uint _nonce, bytes _clientSign) {
        assert(PayAtTable(_payAtTable).removeAllowTokenWithSign(_tokenAddress, _nonce, _clientSign));
    }

    function pay(address _payAtTable, address _storeAddress, bytes32 _receiptId, address _tokenAddress, uint _amount, uint _nonce, bytes _clientSign) {
        assert(PayAtTable(_payAtTable).payWithSign(_storeAddress, _receiptId, _tokenAddress, _amount, _nonce, _clientSign));
    }

    function refund(address _payAtTable, bytes32 _receiptId, uint _nonce, bytes _clientSign) {
        assert(PayAtTable(_payAtTable).refundWithSign(_receiptId, _nonce, _clientSign));
    }

    function getTokenAddress(address _payAtTable, address _storeAddress, bytes32 _receiptId) constant returns (address tokenAddress) {
        return PayAtTable(_payAtTable).getTokenAddress(_storeAddress, _receiptId);
    }

    function getTotalAmount(address _payAtTable, address _storeAddress, bytes32 _receiptId) constant returns (uint totalAmount) {
        return PayAtTable(_payAtTable).getTotalAmount(_storeAddress, _receiptId);
    }

    function getAllowTokensLength(address _payAtTable, address _storeAddress) constant returns (uint length) {
        return PayAtTable(_payAtTable).getAllowTokensLength(_storeAddress);
    }

    function getAllowToken(address _payAtTable, address _storeAddress, uint _index) constant returns (address tokenAddress) {
        return PayAtTable(_payAtTable).getAllowToken(_storeAddress, _index);
    }

    function getPayersLength(address _payAtTable, address _storeAddress, bytes32 _receiptId) constant returns (uint length) {
        return PayAtTable(_payAtTable).getPayersLength(_storeAddress, _receiptId);
    }

    function getPayer(address _payAtTable, address _storeAddress, bytes32 _receiptId, uint _index) constant returns (address payer) {
        return PayAtTable(_payAtTable).getPayer(_storeAddress, _receiptId, _index);
    }

    function getPaidAmount(address _payAtTable, address _storeAddress, bytes32 _receiptId, address _payer) constant returns (uint amount) {
        return PayAtTable(_payAtTable).getPaidAmount(_storeAddress, _receiptId, _payer);
    }
}
