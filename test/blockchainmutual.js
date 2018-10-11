
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
	    return mutualInstance.withdrawal(1000);
	}).then(function(){
	    return mutualInstance.balanceOf(accounts[0])
	}).then(function(count){
	    assert.equal(count,1000, "value!");
	});
    });

    
    it("send back!", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.transfer(mutualInstance.address, 1000);
	}).then(function(){
	    return mutualInstance.balanceOf(accounts[0])
	}).then(function(count){
	    assert.equal(count,0, "value!");
	    return mutualInstance.balanceOf(mutualInstance.address)
	}).then(function(count){
	    assert.equal(count,1000000*10**2, "value!");
	});
    });
    
    it("Add a policyholder", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.addPolicyholder();
	}).then(function(rtn){
	    //console.log(rtn);
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,1, "one policyholder");
	    return (mutualInstance.getPolicyholderData(accounts[0]));
	}).then(function(policyholder){
	    assert.notEqual(policyholder[3],undefined);
	    assert.equal(policyholder[0],false, "no active policy");
	    assert.equal(policyholder[1],true, "real policy");
	    assert.equal(policyholder[4],1, "ID confirmed");
	    return mutualInstance.getPolicyholderList();
	}).then(function(adr){
	    //console.log('address?', adr)
	    assert.equal(adr,accounts[0],'the address is correct');
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,0, "zero policies");
	    return mutualInstance.balanceOf(accounts[0]);
	}).then(function(bal){
	    assert.equal(bal,100,"initial deposit of 100");
	});
    });
    
    it("buy policy", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.buyPolicy();
	}).then(function(){
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,1, "one policy");
	    return (mutualInstance.getPortfolioData());
	}).then(function(portData){
	    console.log(portData);
	    assert.equal(portData[0],100,'total premium is recorded');
	    assert.equal(portData[1],0,'no claims recorded');
	    assert.equal(portData[2],0,'no dividends recorded');

	    return (mutualInstance.getPolicyholderData(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[0],true, "active policy");
	    assert.equal(policyholder[1],true, "real policy");
	    return mutualInstance.balanceOf(accounts[0]);
	}).then(function(bal){
	    assert.equal(bal,0,"paid 100 now have 0 left");
	});
    });

    it("Cancel policy", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.cancelPolicy();
	}).then(function() {
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,0, "zero policies");
	    return (mutualInstance.getPolicyholderData(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[0],false, "active policy");
	    assert.equal(policyholder[1],true, "real policy");
	});
    });

    
    it("delete policyholder", function() {
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.deletePolicyholder();
	}).then(function(){
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,0, "no policyholders");
	    return (mutualInstance.balanceOf(accounts[0]));
	}).then(function(count){
	    assert.equal(count,0, "no coins left");
	});
    });

    // test claim count 0
    it('claim count 0',function (){
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.claimsCount();
	}).then(function(claimsCount){
	    assert.equal(claimsCount,0,'no claims yet!');
	});
    });


    it('adding more policyholders',function(){
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,0, "no policyholders");
	}).then(function(){
	    return mutualInstance.addPolicyholder({from:accounts[0]});
	}).then(function(){
	    return mutualInstance.buyPolicy({from:accounts[0]});
	}).then(function(){
	    return mutualInstance.addPolicyholder({from:accounts[1]});
	}).then(function(){
	    return mutualInstance.buyPolicy({from:accounts[1]});
	}).then(function(){
	    return mutualInstance.addPolicyholder({from:accounts[2]});
	}).then(function(){
	    return mutualInstance.buyPolicy({from:accounts[2]});
	}).then(function(){
	    return mutualInstance.addPolicyholder({from:accounts[3]});
	}).then(function(){
	    return mutualInstance.buyPolicy({from:accounts[3]});
	}).then(function(){
	    return (mutualInstance.policyholdersCount());
	}).then(function(count){
	    assert.equal(count,4, "four policyholders");
	    return (mutualInstance.policyCount());
	}).then(function(count){
	    assert.equal(count,4, "four policies");
	});
    }); 
    
    // add a claim and re-test claim count
    it('adding a claim',function (){
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.submitClaim(10000, {from:accounts[0]});
	}).then(function(rtn){
	    return mutualInstance.claimsCount();
	}).then(function(cc){
	    assert.equal(cc.toNumber(),1,('confirm one total claim'));	    
	    return mutualInstance.getOpenClaims();
	}).then(function(claimsList){
	    assert.equal(claimsList[0],1,('confirm one open claim'));
	    assert.equal(claimsList[1][0],1,"first claim is with ID 1");
	    return (mutualInstance.getClaim(1));
	}).then(function(claimData){
	    assert.notEqual(claimData,undefined,"undefined!");
	    
	    assert.equal(claimData[1],accounts[0],'is the submitter right?');
	    assert.equal(claimData[2],false,'has the vote resolved?');
	    assert.equal(claimData[3],false,'not yet a valid claim');
	    assert.equal(claimData[4],10000,'is the value right?!');
	    assert.equal(claimData[5],0,'no votes for');
	    assert.equal(claimData[6],0,'no votes at all');
	    return mutualInstance.hasVoted(1,accounts[0]);
	}).then(function(voteCheck){
	    assert.equal(voteCheck,true,'the user has voted');
	    return mutualInstance.hasVoted(1,accounts[1]);
	}).then(function(voteCheck){
	    assert.equal(voteCheck,false,'the user has not voted');

	});
    });
    
    
    // test vote
    it('claim Vote',function (){
	return blockchainmutual.deployed().then(function(instance) {
	    
	    mutualInstance = instance;
	    return mutualInstance.haveIVoted(1,{from:accounts[1]});
	}).then(function(voteCheck){
	    assert.equal(voteCheck,false,'this user has not yet voted');
	    return(mutualInstance.claimVote(1,true, {from:accounts[1]}));
	}).then(function(){
	    return mutualInstance.haveIVoted(1,{from:accounts[1]});
	}).then(function(voteCheck){
	    assert.equal(voteCheck,true,'this user has voted!');
	    return mutualInstance.getClaim(1);
	}).then(function(claimData){
	    assert.equal(claimData[5],1,'one vote for');
	    assert.equal(claimData[6],1,'one vote overall');
	    return mutualInstance.claimVote(1,false, {from:accounts[2]});
	}).then(function(){
	    return mutualInstance.getClaim(1);
	}).then(function(claimData){
	    assert.equal(claimData[5],1,'one vote for');
	    assert.equal(claimData[6],2,'two votes overall');
	    return mutualInstance.hasVoted(1,accounts[2]);
	}).then(function(voteCheck){
	    assert.equal(voteCheck,true,'this user has voted!');
	});
    });

    // test claim payout, policyholder claim data
    
    it('paying a claim',function(){
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.getOpenClaims();
	}).then(function(openClaims){
	    console.log(openClaims[1][0]); // is htis a list of index:value that are identical?
	    return mutualInstance.claimVote(1,true, {from:accounts[3]});
	}).then(function(){
	    return mutualInstance.getPolicyholderVotingRecord(accounts[3]);
	}).then(function(policyholderData){
	    assert.equal(policyholderData[0][0],1,('voting status intact',console.log(policyholderData)));
	    assert.equal(policyholderData[0][1],true,('voting record intact',console.log(policyholderData)));
	    return mutualInstance.getOpenClaims();
	}).then(function(openClaims){
	    assert.equal(openClaims[0],0, "no open claims");
	}).then(function(){
	    return mutualInstance.claimsCount();
	}).then(function(count){
	    assert.equal(count,1, "still one claim total, but closed");
	    return (mutualInstance.getPolicyholderData(accounts[0]));
	}).then(function(policyholder){
	    assert.equal(policyholder[2],true, "has a claim");
	    return (mutualInstance.getPolicyholderClaimsData(accounts[0]));
	}).then(function(policyholderClaimData){
	    assert.equal(policyholderClaimData.length,1, "has 1 claim");
	    assert.equal(policyholderClaimData[0][0],1, "claimId is 1");
	    assert.equal(policyholderClaimData[0][1],10000, "claim is for 10k");
	    
	});

    });

    // get list of open claims

    it('adding more claims',function (){
	return blockchainmutual.deployed().then(function(instance) {
	    mutualInstance = instance;
	    return mutualInstance.submitClaim(100000,{from:accounts[1]});
	}).then(function(rtn){
	    return mutualInstance.submitClaim(1000,{from:accounts[2]});
	}).then(function(rtn){
	    return mutualInstance.claimsCount();
	}).then(function(cc){
	    assert.equal(cc.toNumber(),3,('confirm three total claims', console.log(cc)));
	    return mutualInstance.getOpenClaims();
	}).then(function(openClaims){
	    assert.equal(openClaims[0],2,('confirm two open claims',console.log(openClaims)));
	    assert.equal(openClaims[1][1],2,"second claim in list has ID 2");
	});
    });
    
});
