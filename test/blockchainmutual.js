// test coins initiation
// test coin sending
x
var blockchainmutual = artifacts.require("./blockchainmutual.sol");


contract("blockChainMutual", function(accounts) {
    var mutualInstance;

    it("initializes with no policyholders", function() {
	return blockchainmutual.deployed().then(function(instance){
	    mutualInstance = instance;
	    return mutualInstance.policyholdersCount();
	}).then(function(count){
	    assert.equal(count, 0, "no policyholders");
	    return mutualInstance.policyCount();
	}).then(function(count){
	    assert.equal(count, 0, "no policies");
	});
    });


    it("coin balance", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.balanceOf(mutualInstance.address);
	}).then(function(count){
	    assert.equal(count,1000000*10**2, "value!");
	});
    });


    it("withdraw", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.withdrawal(1000);
	    return mutualInstance.balanceOf(accounts[0])
	}).then(function(count){
	    assert.equal(count,1000, "value!");
	});
    });

    
    it("send back!", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.transfer(mutualInstance.address, 500);
	    return mutualInstance.balanceOf(accounts[0])
	}).then(function(count){
	    assert.equal(count,500, "value!");
	    return mutualInstance.balanceOf(mutualInstance.address)
	}).then(function(count){
	    assert.equal(count,1000000*10**2 - 500, "value!");
	});
    });
    
    it("Add a policyholder", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.addPolicyholder();
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,1, "one policyholder");
	    return (mutualInstance.policyholders(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[0],false, "no active policy");
	    assert.equal(policyholder[1],true, "real policy");
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,0, "zero policies");
	});
    });

    it("buy policy", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.buyPolicy();
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,1, "one policy");
	    return (mutualInstance.policyholders(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[0],true, "active policy");
	    assert.equal(policyholder[1],true, "real policy");
	    return mutualInstance.balanceOf(accounts[0]);
	}).then(function(bal){
	    assert.equal(bal,400,"paid 100 now have 400 left");
	});
    });


    
    it("Cancel policy", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.cancelPolicy();
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,0, "zero policies");
	    return (mutualInstance.policyholders(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[0],false, "active policy");
	    assert.equal(policyholder[1],true, "real policy");
	});
    });

    
    it("delete policyholder", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    mutualInstance.deletePolicyholder();
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,0, "no policyholders");
	    return (mutualInstance.balanceOf(accounts[0]));
	}).then(function(count){
	    assert.equal(count,0, "no coins left");
	});
    });

});    

