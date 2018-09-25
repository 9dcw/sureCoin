pragma solidity 0.4.24;

// next we add the ability to submit a claim and vote on claims submitted
// votes attract sureCoins



contract blockChainMutual {
  address public myself;
  address public owner;
  //Store policyholder Count.. can't count it later in the blockchain
  uint public policyholdersCount = 0;
  uint public policyCount = 0;
  // all claims filed
  uint public claimsCount = 0;
  // count of open claims, can just count the elements in js
  uint public openClaimsCount = 0;
  // open claims
  uint[] openClaims;
  mapping(address => uint) public balances; // List of user balances.
  // the listing of claims
  mapping(uint=> claim) claimsListing;
  
  struct claim {
    uint id;
    address submitter;
    bool resolved; // whether the vote has happened
    bool valid; // whether the claim is real
    uint value; // amount claimed
    uint votesFor; // votes in favor 
    uint votesCount; // all votes 
    mapping(address=>bool) voted; // the list of users that have voted on the claim
  }
  
  // Constructor
  
  constructor () public {
    owner = msg.sender;
    uint decimals = 2;
    uint INITIAL_SUPPLY = 1000000 * (10 ** decimals);    
    balances[address(this)] = INITIAL_SUPPLY;
    myself = address(this);
  }
  
  event Transfer(address indexed from, address indexed to, uint value);
  // record that we added or canceled a policy
  event BCMevent(string eventType, uint id, uint value, address from, address to);
  
  function transfer(address _to, uint _value) public {
    balances[msg.sender] = balances[msg.sender] - _value;
    balances[_to] = balances[_to] + _value;
    emit Transfer(msg.sender, _to, _value);
    emit BCMevent('transfer', 0,_value, msg.sender, _to);
  }

  function withdrawal(uint _value) public {
    
    balances[address(this)] = balances[address(this)] - _value;
    balances[msg.sender] = balances[msg.sender] + _value;
    emit BCMevent('transfer', 0,_value, address(this), msg.sender);
    emit Transfer(address(this), msg.sender, _value);
  }

  function payClaim (uint _claimID) public {
    address claimant = claimsListing[_claimID].submitter;
    uint claimValue = claimsListing[_claimID].value;
    balances[address(this)] = balances[address(this)] - claimValue;
    balances[claimant] = balances[claimant] + claimValue;
    emit Transfer(address(this),claimant, claimValue);
    emit BCMevent('transfer', 0,claimValue, address(this), claimant);
    policyholders[claimant].claims=true;
    policyholders[claimant].paidClaimsData.push([_claimID,claimValue]);
    emit BCMevent('claimPayment', _claimID,claimValue, address(this), claimant);
  }
  
  function balanceOf(address _owner) public constant returns (uint balance) {
    return balances[_owner];
  }
  
  // model a policy holder
  struct policyholder {
    bool current;
    bool isExist;
    bool claims;
    uint[2][] paidClaimsData; // this will be claim number with value
    uint[2][] votingRecord; // claimID with yes or no attached
  }

  mapping(address=> policyholder) policyholders;
  
  function getPolicyholderData (address id) public constant returns (bool, bool, bool) {
    return (policyholders[id].current, policyholders[id].isExist,
	    policyholders[id].claims);
  }
  
  function getPolicyholderVotingRecord (address id) public constant returns (uint[2][]) {
    return (policyholders[id].votingRecord);
  }
  

  function getPolicyholderClaimsData (address id) public constant returns (uint[2][]) {
    return (policyholders[id].paidClaimsData);
  }
  
  function buyPolicy () public {

    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    //require(balanceOf(msg.sender) > 100, "you need 100 coins!");
    uint cost = 100;
    transfer(address(this), cost);
    policyholders[msg.sender].current=true;
    policyCount ++;

    // type, id, value, from, to
    emit BCMevent('policyPurchase', 0, cost,address(this),msg.sender );
  }
  
  function cancelPolicy () public {
    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    require(policyholders[msg.sender].current=true, "you don't have a policy!");

    policyholders[msg.sender].current=false;
    policyCount --;
    //delete inForcePolicyholders[msg.sender];
    // type, id, value, from, to
    emit BCMevent('policyCancellation', 0, 0,msg.sender,address(this));
  }
  
  function addPolicyholder () public {
    policyholdersCount ++;
    policyholders[msg.sender].current=false;
    policyholders[msg.sender].isExist=true;
    balances[msg.sender] = 0;
    emit BCMevent('addPolicyholder', policyholdersCount, 0,address(this),msg.sender);
    uint initialBalance = 100;
    withdrawal(initialBalance);
    
    // type, id, value, from, to
  }

  function deletePolicyholder () public {
    policyholdersCount --;
    // dump the coins back into the bank
    
    transfer(address(this), balanceOf(msg.sender));
    
    delete policyholders[msg.sender];
    emit BCMevent('deletePolicyholder', 0, 0,msg.sender,address(this));
  }

  
  function hasVoted (uint claimID, address id) public constant returns (bool){
    return (claimsListing[claimID].voted[id]);
  }
  
  function haveIVoted (uint claimID) public constant returns (bool){
    return (claimsListing[claimID].voted[msg.sender]);
  }
  
  function getClaim (uint claimID) public constant returns (uint, address, bool, bool, uint, uint, uint)  {
    return (claimID, claimsListing[claimID].submitter,claimsListing[claimID].resolved,claimsListing[claimID].valid,
	    claimsListing[claimID].value,claimsListing[claimID].votesFor,claimsListing[claimID].votesCount); 
  }
  
  function getOpenClaims () public constant returns (uint, uint[])  {
    return (openClaimsCount, openClaims); 
  }
  
  function submitClaim (uint _value) public  {
    
    claimsCount ++;
    openClaimsCount ++;

    openClaims.push(claimsCount);    
    claimsListing[claimsCount].id=claimsCount;
    claimsListing[claimsCount].submitter=msg.sender;
    claimsListing[claimsCount].resolved=false;
    claimsListing[claimsCount].valid=false;
    claimsListing[claimsCount].value=_value;
    claimsListing[claimsCount].votesFor=0;
    claimsListing[claimsCount].votesCount=0;
    claimsListing[claimsCount].voted[msg.sender]=true; // so submitter can't vote!
    
    emit BCMevent('newClaim',claimsCount,_value,msg.sender, address(this));
    // would be cool to put together an evaluation page that only the account ID holder can access.
    // that will include the image and write-up of a submitted claim
    // along with some policy information 
  }
  
  function claimVote (uint claimID, bool result) public {
    // require that they haven't voted before
    require(claimsListing[claimID].voted[msg.sender]==false); // this is a test of whether the address has voted
    
    // needs to be a policyholder!
    require(policyholders[msg.sender].current==true);
    
    // record that voter has voted
    claimsListing[claimID].voted[msg.sender]=true; 
    
    // require a valid claim number
    require(claimID > 0 && claimID <= claimsCount);
    
    // update candidate vote count
    claimsListing[claimID].votesCount ++;
    
    // is it for or against?!
    if (result == true){
      claimsListing[claimID].votesFor ++;
    }

    uint voteResult = result ? 1 : 0;
    policyholders[msg.sender].votingRecord.push([claimID,voteResult]);
    
    emit BCMevent('claimVote',claimID,voteResult,msg.sender,address(0));    
    uint falseVotes;
    falseVotes = claimsListing[claimID].votesCount-claimsListing[claimID].votesFor;
    // if the number of positive votes is 2, we can close it down
    if (claimsListing[claimID].votesFor >= 2 && (claimsListing[claimID].votesCount-claimsListing[claimID].votesFor) <= 2){
      closeClaim(claimID, true);
    }
    
    else if ((claimsListing[claimID].votesCount-claimsListing[claimID].votesFor) >=2){
      closeClaim(claimID, false);
      }
  }
  
  function closeClaim  (uint claimID, bool result) public {
    	claimsListing[claimID].resolved=true;
	claimsListing[claimID].valid=result;
	uint value = 0;
	if (result == true) {
	  payClaim(claimID);
	  value=claimsListing[claimID].value;
	}
	delete claimsListing[claimID];
	openClaimsCount --;

	// claim IDs start at 0
	delete openClaims[claimID-1];
	emit BCMevent('claimClosed',claimID,value,
		      address(this),claimsListing[claimID].submitter);
  }
  
  // self destruct
  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
  }

}
