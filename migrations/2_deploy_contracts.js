var BlockchainMutual = artifacts.require("./BlockchainMutual.sol");

module.exports=function(deployer) {
    deployer.deploy(BlockchainMutual);
};

