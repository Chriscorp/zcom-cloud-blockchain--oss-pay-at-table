pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionLogic.sol';
import './Demo.sol';
import './TokenSample.sol';

contract DemoLogic_v1 is VersionLogic, Demo {
    // This is a sample contract, so don't create event contract
    event CreateToken(address _token);

    function DemoLogic_v1(ContractNameService _cns) VersionLogic (_cns, CONTRACT_NAME) {}

    function createToken(address _from, bytes32 _symbol, bytes32 _name, uint _supplyVolume) onlyByVersionContractOrLogic {
        address token = new TokenSample(_from, _symbol, _name, _supplyVolume);
        CreateToken(token);
    }
}
