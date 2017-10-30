pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionContract.sol';
import './ProxyController.sol';
import './ProxyControllerLogic_v1.sol';

contract ProxyController_v1 is VersionContract, ProxyController {
    ProxyControllerLogic_v1 public logic_v1;

    function ProxyController_v1(ContractNameService _cns, ProxyControllerLogic_v1 _logic_v1) VersionContract(_cns, CONTRACT_NAME) {
        logic_v1 = _logic_v1;
    }

    function getSymbol(address _tokenAddress) constant returns (bytes32 symbol) {
        return logic_v1.getSymbol(_tokenAddress);
    }

    function getName(address _tokenAddress) constant returns (bytes32 name) {
        return logic_v1.getName(_tokenAddress);
    }

    function getTotalSupply(address _tokenAddress) constant returns (uint totalSupply) {
        return logic_v1.getTotalSupply(_tokenAddress);
    }

    function getNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return logic_v1.getNonce(_tokenAddress, _addr);
    }

    function getBalance(address _tokenAddress, address _addr) constant returns (uint balance) {
        return logic_v1.getBalance(_tokenAddress, _addr);
    }

    function getAllowance(address _tokenAddress, address _holder, address _spender) constant returns (uint balance) {
        return logic_v1.getAllowance(_tokenAddress, _holder, _spender);
    }

    function approve(bytes _sign, address _tokenAddress, address _spender, uint _amount, uint _nonce, bytes _clientSign) {
        logic_v1.approve(_tokenAddress, _spender, _amount, _nonce, _clientSign);
    }

    function transfer(bytes _sign, address _tokenAddress, address _to, uint _amount, uint _nonce, bytes _clientSign) {
        logic_v1.transfer(_tokenAddress, _to, _amount, _nonce, _clientSign);
    }


    function getPayAtTableNonce(address _payAtTable, address _addr) constant returns (uint nonce) {
        return logic_v1.getPayAtTableNonce(_payAtTable, _addr);
    }

    function addAllowToken(bytes _sign, address _payAtTable, address _tokenAddress, uint _nonce, bytes _clientSign) {
        logic_v1.addAllowToken(_payAtTable, _tokenAddress, _nonce, _clientSign);
    }

    function removeAllowToken(bytes _sign, address _payAtTable, address _tokenAddress, uint _nonce, bytes _clientSign) {
        logic_v1.removeAllowToken(_payAtTable, _tokenAddress, _nonce, _clientSign);
    }

    function pay(bytes _sign, address _payAtTable, address _storeAddress, bytes32 _receiptId, address _tokenAddress, uint _amount, uint _nonce, bytes _clientSign) {
        logic_v1.pay(_payAtTable, _storeAddress, _receiptId, _tokenAddress, _amount, _nonce, _clientSign);
    }

    function refund(bytes _sign, address _payAtTable, bytes32 _receiptId, uint _nonce, bytes _clientSign) {
        logic_v1.refund(_payAtTable, _receiptId, _nonce, _clientSign);
    }

    function getReceipt(address _payAtTable, address _storeAddress, bytes32 _receiptId) constant returns (address tokenAddress, uint totalAmount) {
        tokenAddress = logic_v1.getTokenAddress(_payAtTable, _storeAddress, _receiptId);
        totalAmount = logic_v1.getTotalAmount(_payAtTable, _storeAddress, _receiptId);
    }

    function getAllowTokens(address _payAtTable, address _storeAddress) constant returns (address[] allowTokens) {
        uint length = logic_v1.getAllowTokensLength(_payAtTable, _storeAddress);
        allowTokens = new address[](length);
        for (uint i = 0; i < length; i++) {
            allowTokens[i] = logic_v1.getAllowToken(_payAtTable, _storeAddress, i);
        }
    }

    function getPayers(address _payAtTable, address _storeAddress, bytes32 _receiptId) constant returns (address[] payers) {
        uint length = logic_v1.getPayersLength(_payAtTable, _storeAddress, _receiptId);
        payers = new address[](length);
        for (uint i = 0; i < length; i++) {
            payers[i] = logic_v1.getPayer(_payAtTable, _storeAddress, _receiptId, i);
        }
    }

    function getPaidAmount(address _payAtTable, address _storeAddress, bytes32 _receiptId, address _payer) constant returns (uint amount) {
        return logic_v1.getPaidAmount(_payAtTable, _storeAddress, _receiptId, _payer);
    }
}
