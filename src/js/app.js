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

	var divBlockTime;
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
	var portfolioData;

	var policyholderList;

	var votableL;
	var portfolioData;
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
	    return companyInstance.divBlockTime();
	}).then(function(dbt){
	    divBlockTime = dbt;
	    return companyInstance.getPortfolioData();
	}).then(function(portData){
	    console.log('portdata', portData);
	    
	    var ratio = (parseFloat(portData[2])+parseFloat(portData[1]))/parseFloat(portData[0]);

	    var txt= "<hr/>Total Premium: "+portData[0].toString() +"<hr/>";
	    txt = txt + " Total Claims: "+portData[1].toString();
	    txt = txt + ", Total Dividends: "+portData[2].toString() + "<hr/>";
	    txt = txt + " Paid Loss Ratio: " + ratio.toFixed(4)*100;
	    txt = txt + "<hr/>";
	    portfolioData=txt;
	    
	    
	    return (companyInstance.getPolicyholderData(App.account));
	}).then(function(knownPolicyholderData){
	    
	    // first element is whether they are a policyholder
	    // second element is whether they are current
	    policyholderResults.empty();
	    //console.log(knownPolicyholderData);
	    
	    var knownPolicyholder = knownPolicyholderData[1]
	    currentPolicyholder = knownPolicyholderData[0];
	    var date = new Date;
	    // find out how long it's been since five minutes ago (to correct for block mining)
	    //console.log(date.getTime()/1000);
	    //console.log(knownPolicyholderData[3].toNumber());
	    //console.log('the diff', date.getTime()/1000 - knownPolicyholderData[3]);
	    // adjust for 5 minutes
	    var daysSinceDiv = Math.floor((date.getTime()/1000 - knownPolicyholderData[3]-60*5) / (divBlockTime));
	    
	    var policyholderJoinButton = '<form onSubmit="App.addPolicyholder(); return false;"><button type="submit" class="btn btn-primary">Join!</button></form>'
	    
	    if (knownPolicyholder == false){
		accountText.empty()
		accountText.append(accountTextID);
		
		// they are not a current policyholder, show a buy policy button!
		var policyHolderText = 'Not a policyholder yet!';
		policyholderTemplate =  policyholderTemplate+'<tr><td>'+policyHolderText+"</td><td>" + policyholderJoinButton + "</td></tr>";
		coinRequestTemplate = '';
	    }
	    
	    //  what happens if a policyholder... 
	    else
	    {
		var policyBuyButton = '<form onSubmit="App.buyPolicy(); return false;"><button type="submit" class="btn btn-primary">Buy Policy</button></form>';

		var policyCxlBtn = '<form onSubmit="App.cancelPolicy(); return false;"><button type="submit" class="btn btn-primary">Cancel Policy</button></form>';

		var clmSubmitBtn = '<form onSubmit="App.submitClaim(); return false;"><button type="submit" class="btn btn-primary">Submit Claim</button></form>';

		var claimDividendBtn =  '<form onSubmit="App.claimDividend(); return false;"><button type="submit" class="btn btn-primary">Claim Dividend</button></form>';
		var divText = "<tr><td>"+daysSinceDiv.toString()+" Dividends Unclaimed!</td><td>"+claimDividendBtn + "</td></tr>";

		var deletePolicyholderButton = '<form onSubmit="App.deletePolicyholder(); return false;"><button type="submit" class="btn btn-primary">Delete Your Account</button></form>';
		
		accountText.empty()
		accountText.append(portfolioData, accountTextID, '<p>'+deletePolicyholderButton+'</p>');
		
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
		    console.log('days', daysSinceDiv);
		    if (daysSinceDiv >= 1) {
			policyholderTemplate = policyholderTemplate+ divText;
		    }
		}
		
		else {
		    console.log('not current policyholder');
		    // if they aren't a policyholder, we can show the buy a policy button!
		    var policyHolderText = "We remember you but can't find a policy! Want to buy back in?";
		    policyholderTemplate =  policyholderTemplate+'<tr><td>'+policyHolderText+"</td><td>" + policyBuyButton + "</td></tr>";
		    //console.log('policyholdertemplate', policyholderTemplate);
		}
	    }
	    
	    policyholderResults.append(policyholderTemplate);
	}).then(function(){ 
	    return companyInstance.balanceOf(App.account);	   
	}).then(function(bal){
    	    //console.log('balance!', bal);
	    coinBalanceTemplate = "<tr><td>Your SureCoin Balance</td><td>" + Math.round(bal) + "</td></tr>";
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
	    //console.log('voting record compare', votingRecord.length, votingRecord,openClaimsList.length, openClaimsList);


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
	    //console.log(votableL, currentPolicyholder);
	    return companyInstance.getPolicyholderList();
	}).then(function(policyholderListRaw){

	    if (currentPolicyholder == true){
		
		policyholderList = policyholderListRaw;
		if (policyholderList.length > 1) {
		    // only if this isn't the only poilcyholder!
		    $('#policyholderList').show();
		}

		var policyholderSelect = $('#policyholderSelect');
		policyholderSelect.empty();

		for (var i = 1; i <= policyholderList.length; i++) {
		    if (policyholderList[i-1] != undefined) // is this how it presents?
		    {
			var id = policyholderList[i-1];
			if (id == App.account) {id = 'You!'} 
			var idOption = "<option value='"+id+ "' >" +id + "</ option>"
			policyholderSelect.append(idOption);

		    }
		}

		
		if (votableL > 0) {

		    // loop through the open claims that
		    // this user hasn't voted on yet. 
		    $('#claimList').show();
		    var openClaimsSelect = $('#openClaimSelect');
		    openClaimsSelect.empty();
		    
		    var openClaimsData = $('#openClaimsData');
		    openClaimsData.empty();

		    $('#openClaimsData').show();
		    $('#claimsVotingArea').show();


		    /// here we can input the policyholder addresses!
		    // need to build in the coutn

		    //$('#claimList').show();
		    for (var i = 1; i <= votableL; i++) {
			claimID = votableClaimIDs[i-1];
			var candidateOption = "<option value='" + claimID + "' >" + claimID + "</ option>"
			openClaimsSelect.append(candidateOption);
		    }
		    
		    
		    $('#claimsTitle').show();
		    $('#claimsList').show();
		    $('#openClaimsDataArea').show();
		    $('#openClaimsData').show();
		    
		    App.displayClaim();
		    App.displayPolicyholder();
		}
		
		// don't need an open claim to display this
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
	    return companyInstance.balanceOf(App.account);
	}).then(function(bal){
	    if (bal < 100) {return 0}
	    else {return companyInstance.buyPolicy({from:App.account})}
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
	    return instance.submitClaim(200);
	});
    },



    // I need to define the table that will show the addresses!

    coinTransfer: function (address, amount) {
	console.log('coin transfer!');
	var companyInstance;
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    companyInstance = instance;
	    return companyInstance.balanceOf(App.account);
	}).then(function(balance){

	    console.log('balance!', balance.toNumber(), amount);
	    if (balance.toNumber() >=amount){
		console.log('transferring!');
		companyInstance.transfer(address, amount);
	    }
	    else {$('#policyholderDataArea').append('error, not enough funds!')}
	});
    },

    
    displayPolicyholder: function (address){
	
	if (address==undefined){
	    address = $('#policyholderSelect').val();
	}
	if (address == 'You!'){address=App.account}
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    instance.getPolicyholderClaimsData(address).then(function(polData) {

		// allow transfer of coins to the account in question
		var transferBtn = '<form onSubmit="App.coinTransfer('+address.toString()+',100); return false;"><button type="submit" class="btn btn-primary">transfer 100 coins to this guy!</button></form>'
		
 		var policyholderHeader;
		policyholderHeader = '<tr><th>Address</th><th>Claims Count</th><th></th></tr>';
		if (address == App.account){
		    submitter = 'You!';transferBtn = '';

					   }
		else {submitter = address.substring(0,7)+ '...';
		      //policyholderHeader =  = '<tr><th>Address</th><th>Claims Count</th><th></tr>';			    
		      
		     }
		
		var claimsCount = polData.length;
		console.log(claimsCount);
		// this is going to get pushed to a list of the claims for information

		var policyholderTemplate = "<tr><td>" + submitter + "</td><td>" + claimsCount+"</td><td>"+transferBtn+"</td></tr>"
		$('#policyholderDataTable').html(policyholderHeader+policyholderTemplate);
		$('#policyholderDataTable').show();
	    });
	});
    },

    
    displayClaim: function (accountID){
	
	var claimID = $('#openClaimSelect').val();
	
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    instance.getClaim(claimID).then(function(claimData) {
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
		
		if (votableL > 0) {
		    $('#claimsVotingHistory').show()
		    $('#votingHistoryTable').show()   
		    
		}
		for (var i = 1; i <= votableL; i++) {
		    var voteResult = false;
		    if (claimData[i-1][1]== 1) {voteResult = true}
		    votingHistory = votingHistory + "<tr><td>" + claimData[i-1][0];
		    //votingHistory = votingHistory + "<tr><td>" + claimData[i-1][2];
		    
		    votingHistory = votingHistory + "</td><td>" + voteResult + "</td></tr>";
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
	
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	
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

    claimDividend: function () {
	App.contracts.BlockchainMutual.deployed().then(function(instance){
		return instance.issueDividend();
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
