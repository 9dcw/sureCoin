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
	
	var companyInstance; 
	var loader = $("#loader");
	var content = $("#content");
	var coinBalanceTemplate;
	var availableBalanceTemplate;
	var policyholderTemplate;
	// here we are defining how the table is going to work 
	var policyholderResults = $('#policyholderResults');
	var accountText = $("#accountAddress"); 
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
	    	    
	    return (companyInstance.policyholders(App.account));
	}).then(function(knownPolicyholderData){
 	    // first element is whether they are a policyholder
	    // second element is whether they are current
	    policyholderResults.empty();
	    //console.log(policyholderResults);


	    //console.log('known?', knownPolicyholderData[1]);
	    var knownPolicyholder = knownPolicyholderData[1]
	    var currentPolicyholder = knownPolicyholderData[0];	    
	    //console.log('current?', knownPolicyholderData[0]);
	    

	    var policyholderJoinButton = '<form onSubmit="App.addPolicyholder(); return false;"><button type="submit" class="btn btn-primary">Join!</button></form>'

	    if (knownPolicyholder == false){
		accountText.empty()
		accountText.append(accountTextID);

		// they are not a current policyholder, show a buy policy button!
		var policyHolderText = 'Not a policyholder yet!';
		policyholderTemplate =  policyholderTemplate+'<tr><td>'+policyHolderText+"</td><td>" + policyholderJoinButton + "</td></tr>";
	    }
	    //  what happens if this isn't a policyholder... ask to join
	    else
	    {
		

		
		var policyBuyButton = '<form onSubmit="App.buyPolicy(); return false;"><button type="submit" class="btn btn-primary">Buy Policy</button></form>'

		var policyCxlButton = '<form onSubmit="App.cancelPolicy(); return false;"><button type="submit" class="btn btn-primary">Cancel Policy</button></form>'

		var deletePolicyholderButton = '<form onSubmit="App.deletePolicyholder(); return false;"><button type="submit" class="btn btn-primary">Delete Your Account</button></form>'
		accountText.empty()
		accountText.append(accountTextID, '<p>'+deletePolicyholderButton+'</p>');
		
    		//var coinRequestTemplate = "<tr><td>Want more coins?</td><td>" + coinRequestButton + "</td></tr>";
		//policyholderResults.append(coinRequestTemplate);
		
		if (currentPolicyholder == true) {
		    // they are a current policyholder. Say thanks!
		    //console.log('current policyholder');
		    var policyHolderText = 'Current Policyholder!';
		    policyholderTemplate = policyholderTemplate+ '<tr><td>'+policyHolderText+"</td><td>"+policyCxlButton + "</td></tr>";
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
    	    var coinRequestButton = '<form onSubmit="App.withdrawal(100); return false;"><button type="submit" class="btn btn-primary">Withdraw 100 coins</button></form>'

	    coinBalanceTemplate = "<tr><td>Your SureCoin Balance</td><td>" + balance + "</td></tr>";
	    coinBalanceTemplate = coinBalanceTemplate + "<tr><td>Request More Coins!</td><td>" + coinRequestButton + "</td></tr>";
	    
	}).then(function(){ // this is necessary so we interrupt the whole process so the call can resolve

	    return companyInstance.balanceOf(companyInstance.address);	    
	}).then(function(availableBalance){
	    console.log('policytemplate3', policyholderTemplate);	    
	    availableBalanceTemplate = "<tr><td>Balance In The Bank</td><td>" + availableBalance + "</td></tr>";
	    policyholderResults.empty()
	    policyholderResults.append(policyholderTemplate, availableBalanceTemplate,coinBalanceTemplate);
	    
	    
	}).then(function() {
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
	    console.log('checking policyholder status!');
	    return companyInstance.policyholders(App.account);
	}).then(function(status) {
	    if ( status[1] == false) // not yet a policyholder
	    {App.addPolicyholder()}
	    console.log('policyholder?', status[1], 'current?', status[0],"buying policy!");
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
	    console.log('adding policyholder');
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
	    //App.cancelPolicy;
	    return instance.deletePolicyholder();
	});
    },

    cancelPolicy: function (){
	var companyInstance;
	App.contracts.BlockchainMutual.deployed().then(function(instance){
	    companyInstance=instance;
	    return companyInstance.policyholders;
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
	    instance.policyEvent({}, { //looking for event instance
		fromBlock: 0, // start at the first block
		toBlock: 'latest' // so catches all blocks on the chain

	    }).watch(function(error,event) {
		console.log("event triggered",event)
		//Reload when a new vote is recorded
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
