App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: function() {
	return App.initWeb3();
    },

    initWeb3: function() {
	if (typeof web3 !== 'undefined') {
	    // If a web3 instance is already provided by Meta Mask.
	    App.web3Provider = web3.currentProvider;
	    web3 = new Web3(web3.currentProvider);
	} else {
	    // Specify default instance if no web3 instance provided
	    App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
	    web3 = new Web3(App.web3Provider);
	}
	return App.initContract();
    },
    
    initContract: function() {
	$.getJSON("BlockchainMutual.json", function(blockchainmutual) {
	    // Instantiate a new truffle contract from the artifact
	    App.contracts.BlockchainMutual = TruffleContract(blockchainmutual);
	    // Connect provider to interact with contract
	    App.contracts.BlockchainMutual.setProvider(App.web3Provider);
	    App.listenForEvents();
	    return App.render();
	});
    },
    
    render: function() {
	var claimsDataArray = [];
	var companyInstance; 
	var loader = $("#loader");
	var content = $("#content");

	var coinBalanceTemplate;
	var availableBalanceTemplate;
	var policyholderTemplate;
	var coinRequestTemplate;
	var currentPolicyHolder = false;
	var policyholderResults = $('#policyholderResults');
	var accountText = $("#accountAddress"); 
	var votingRecordV;
	var openClaimsList;
	var votableClaimIDs = [];
	var allClaimsCount;

	var accountTextID;
	var deleteButton;
	policyholderResults.empty();
	var policyholderTemplate =  "";//"<tr><th>Policyholder Status</th><th>Action</th></tr>"	
	loader.show();
	content.hide();
	// Load account data
	web3.eth.getCoinbase(function(err, account) {
	    if (err === null) {
		App.account = account;
		accountTextID = ("Your Wallet ID: " + account); // this is the user's address!
	    }
	});
	
	// this pulls in the contract data
	App.contracts.BlockchainMutual.deployed().then(function(instance) {
	    companyInstance = instance; 
	    console.log(App.account);	    
	    return (companyInstance.getPolicyholderData(App.account));
	}).then(function(knownPolicyholderData){
	     
	    // first element is whether they are a policyholder
	    // second element is whether they are current
	    policyholderResults.empty();
	    //console.log(policyholderResults);

	    var knownPolicyholder = knownPolicyholderData[1]
	    currentPolicyholder = knownPolicyholderData[0];	    

	    var policyholderJoinButton = '<form onSubmit="App.addPolicyholder(); return false;"><button type="submit" class="btn btn-primary">Join!</button></form>'

	    if (knownPolicyholder == false){
		accountText.empty()
		accountText.append(accountTextID);

		// they are not a current policyholder, show a buy policy button!
		var policyHolderText = 'Not a policyholder yet!';
		policyholderTemplate =  policyholderTemplate+'<tr><td>'+policyHolderText+"</td><td>" + policyholderJoinButton + "</td></tr>";
		coinRequestTemplate = '';
	    }
	    //  what happens if this isn't a policyholder... ask to join
	    else
	    {
		var policyBuyButton = '<form onSubmit="App.buyPolicy(); return false;"><button type="submit" class="btn btn-primary">Buy Policy</button></form>'

		var policyCxlBtn = '<form onSubmit="App.cancelPolicy(); return false;"><button type="submit" class="btn btn-primary">Cancel Policy</button></form>'

		var clmSubmitBtn = '<form onSubmit="App.submitClaim(); return false;"><button type="submit" class="btn btn-primary">Submit Claim</button></form>'

		var deletePolicyholderButton = '<form onSubmit="App.deletePolicyholder(); return false;"><button type="submit" class="btn btn-primary">Delete Your Account</button></form>'
		accountText.empty()
		accountText.append(accountTextID, '<p>'+deletePolicyholderButton+'</p>');
		var coinRequestButton = '<form onSubmit="App.withdrawal(100); return false;"><button type="submit" class="btn btn-primary">Withdraw 100 coins</button></form>'
		coinRequestTemplate = "<tr><td>Request More Coins!</td><td>" + coinRequestButton + "</td></tr>";
		//console.log('checking policyholder');
    		//var coinRequestTemplate = "<tr><td>Want more coins?</td><td>" + coinRequestButton + "</td></tr>";
		//policyholderResults.append(coinRequestTemplate);
		
		if (currentPolicyholder == true) {
		    // they are a current policyholder. Say thanks!
		    
		    //console.log('current policyholder');
		    var policyHolderText = 'Current Policyholder!';
		    policyholderTemplate = policyholderTemplate+ '<tr><td>'+policyHolderText+"</td><td>"+policyCxlBtn + "</td></tr>";
		    policyholderTemplate = policyholderTemplate+ "<tr><td>Submit Claims</td><td>"+clmSubmitBtn + "</td></tr>";
		}
		
		else {
		    console.log('not current policyholder');
		    // if they aren't a policyholder, we can show the buy a policy button!
		    var policyHolderText = "We remember you but can't find a policy! Want to buy back in?";
		    policyholderTemplate =  policyholderTemplate+'<tr><td>'+policyHolderText+"</td><td>" + policyBuyButton + "</td></tr>";
		    console.log('policyholdertemplate', policyholderTemplate);
		}
	    }
	    
	    policyholderResults.append(policyholderTemplate);
	}).then(function(){ // this is necessary so we interrupt the whole process so the call can resolve
	    return companyInstance.balanceOf(App.account);	    
	}).then(function(balance){
    	    
	    coinBalanceTemplate = "<tr><td>Your SureCoin Balance</td><td>" + balance + "</td></tr>";
	    coinBalanceTemplate = coinBalanceTemplate + coinRequestTemplate;
	    
	}).then(function(){ // this is necessary so we interrupt the whole process so the call can resolve
	    return companyInstance.balanceOf(companyInstance.address);	    
	}).then(function(availableBalance){
	    
	    availableBalanceTemplate = "<tr><td>Balance In The Bank</td><td>" + availableBalance + "</td></tr>";
	    policyholderResults.empty()
	    policyholderResults.append(policyholderTemplate, availableBalanceTemplate,coinBalanceTemplate);
	    
	    return companyInstance.getOpenClaims();
	}).then(function(openClaims){
	    openClaimsList = openClaims[1];
	    
	    //   return companyInstance.policyholders();
	//}).then(function(policyData){
	    return companyInstance.getPolicyholderVotingRecord(App.account);
	}).then(function(votingRecord){
	    // pull in the voting record
	    console.log('voting record compare', votingRecord.length, votingRecord,openClaimsList.length, openClaimsList);


	    // yuck, a hack!
	    var votables=[];
	    var m;
	    for (var i = 1; i <= openClaimsList.length; i++) {
		m = 0;
		for (var k = 1; k <= votingRecord.length; k++) {
		    //console.log('compare', votingRecord[k-1][0].toNumber(), openClaimsList[i-1].toNumber());
		    if (votingRecord[k-1][0].toNumber() == openClaimsList[i-1].toNumber()){
			//console.log('breaking',i,k);
			m=-1;}
		    else {m++;}
		}
		//console.log('m',m);
		// if we got through the whole list and the Id isn't 0.. being a closed claim
		if (m==votingRecord.length && openClaimsList[i-1].toNumber()!= 0) {
		    votables.push(openClaimsList[i-1].toNumber());}
	    }
	    //console.log('votables', votables);
	    votableClaimIDs=votables;
	    votableL = votableClaimIDs.length;
	    
  	    // now we have the data and the claim ID options to select
	    // Do not allow a user to vote after they have already voted!
	    console.log(votableL, currentPolicyholder);
	    return (votableL);
	}).then(function(voltableL){
	    console.log('outer_claimsarray', claimsDataArray.length, claimsDataArray);		    
	    if (votableL > 0 && currentPolicyholder == true) {

		// loop through the open claims that
		// this user hasn't voted on yet. 
		$('#claimList').show();
		var openClaimsSelect = $('#openClaimSelect');
		openClaimsSelect.empty();
		
		var openClaimsData = $('#openClaimsData');
		openClaimsData.empty();

		$('#openClaimsData').show();
		$('#claimsVotingArea').show();
		
		for (var i = 1; i <= votableL; i++) {
		    console.log('i:', i, votableL);
		    console.log('votable test', votableClaimIDs[i-1]);
		    claimID = votableClaimIDs[i-1];
		    var candidateOption = "<option value='" + claimID + "' >" + claimID + "</ option>"
		    openClaimsSelect.append(candidateOption);
		}

		console.log('policyholder?', currentPolicyholder, votableL);
		$('#claimsVotingArea').show();
		$('#claimsTitle').show();
		$('#claimsList').show();
		$('#openClaimsDataArea').show();
		$('#openClaimsData').show();
		
		App.displayClaim();
		App.displayVotingHistory();

		
	    }
	    return (votableL);
	}).then(function(votableL) {
	    loader.hide();
	    content.show();
	}).catch(function(error) {
	    console.warn(error);
	});
    },

    buyPolicy: function (){
	var companyInstance;
	// here we check if already a policyholder
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    companyInstance = instance;
	    //console.log('checking policyholder status!');
	    return companyInstance.getPolicyholderData(App.account);
	}).then(function(status) {
	    if ( status[1] == false) // not yet a policyholder
	    {App.addPolicyholder()}
	    //console.log('policyholder?', status[1], 'current?', status[0],"buying policy!");
	    return companyInstance.buyPolicy({from:App.account})
	}).then(function(result) {
	    // Wait for data to update
	    $("#content").hide();
	    $("#loader").show();
	}).catch(function(err) {
	    console.error(err);
	});
    },
    
    addPolicyholder: function (){
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    //console.log('adding policyholder');
	    return instance.addPolicyholder();
	}).then(function(result){
	    // Wait for data to update
	    $("#content").hide();
	    $("#loader").show();
	});
    },

    balanceOf: function(accName) {
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    return instance.balanceOf(accName);
	});
    },
    
    deletePolicyholder: function (){
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    return instance.deletePolicyholder();
	});
    },

    // ok let's add in an ability to submit a claim of a certain size
    // we'd also need to build in a policy limit!
    
    submitClaim: function (){
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    return instance.submitClaim(10000);
	});
    },
    
    displayClaim: function (){

	var claimID = $('#openClaimSelect').val();
	console.log('claimId', claimID);
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    instance.getClaim(claimID).then(function(claimData) {
		console.log(claimID);
		//var claimID = claimData[0];
		var submitter = claimData[1];
		if (submitter == App.account){submitter = 'You!'; $('#voteButton').hide()}
		else {submitter = submitter.substring(0,7)+ '...';$('#voteButton').show() }
		var value = claimData[4];
		var votesFor = claimData[5];
		var votes = claimData[6];
		// this is going to get pushed to a list of the claims for information
 		var candidateHeader = '<tr><th>ClaimID</th><th>Submitter</th><th>Value</th><th>VotesFor</th><th>Votes</th></tr>'
		var candidateTemplate = "<tr><td>" + claimID + "</td><td>" + submitter + "</td><td>"+value+"</td><td>"+votesFor+"</td><td>"+votes+"</td></tr>"
		$('#openClaimsData').html(candidateHeader+candidateTemplate);
		$('#openClaimsDataArea').show();
		//your votes
		// companyInstance.getPolicyholderVotingRecord(App.account)
	    });
	});
    },

    displayVotingHistory: function (){
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    instance.getPolicyholderVotingRecord(App.account).then(function(claimData) {
		var votingHistoryHeader = '<tr><th>VotedClaimID</th><th>Vote</th></tr>';
		var votingHistory ='';
		var votableL = claimData.length

		console.log('votableL');
		if (votableL > 0) {
		    $('#claimsVotingHistory').show()
		    $('#votingHistoryTable').show()   
		    
		}
		for (var i = 1; i <= votableL; i++) {
		    var voteResult = false;
		    if (claimData[i-1][1]== 1) {voteResult = true}
		    votingHistory = votingHistory + "<tr><td>" + claimData[i-1][0] + "</td><td>" + voteResult + "</td></tr>";
		}
		$('#votingHistoryTable').html(votingHistoryHeader + votingHistory);
		
	    });
	});
    },
						       
    claimVote: function () {
	var result = $('#edict').val();
	var claimID = $('#openClaimSelect').val();
	var resultBool; 
	if (result == 'valid') {resultBool = true}
	else {resultBool = false}
	console.log(claimID, result, resultBool);
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    console.log(claimID, resultBool);
	    return instance.claimVote(claimID, resultBool);
	});
    },

    cancelPolicy: function (){
	var companyInstance;
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    companyInstance=instance;
	    return companyInstance.getPolicyholderData;
	}).then(function(polData){
	    if (polData[0] == true){
		return companyInstance.cancelPolicy();
	    }
	});
    },

    
    
    withdrawal: function (value){
	    App.contracts.BlockchainMutual.deployed().then(function(instance){
		return instance.withdrawal(value);
	    });
    },
    
    listenForEvents: function() {
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    instance.BCMevent({}, { //looking for event instance
		fromBlock: 'latest', // start at the first block
		toBlock: 'latest' // so catches all blocks on the chain

	    }).watch(function(error,event) {
		console.log("event triggered",event)
		//Reload when a new event is recorded
		App.render();
	    });
	});
    },
    
};
$(function() {
    $(window).load(function() {
	App.init();
    });
});
