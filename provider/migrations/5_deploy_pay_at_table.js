const PayAtTable = artifacts.require('./PayAtTable.sol');

module.exports = function(deployer) {
    deployer.deploy(PayAtTable);
}