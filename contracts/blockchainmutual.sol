pragma solidity 0.4.24;

// next we add the ability to submit a claim and vote on claims submitted
// votes attract sureCoins


contract blockChainMutual {
  address public myself;
  address public owner;
  
  //Store policyholder Count.. need this for an index on the address list
  uint public policyholdersCount = 0;
  
  // a list of the policyholder Addresses
  address[] policyholderList;
  
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
  uint public dividendAmount = 10;
  uint public divBlockTime=60*60; // hours
  // total premium, total claims, total dividends
  uint[3] public portfolioData;
  
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
  
  
  // the generalized version of the transfer. Only callable internally. 
  function transfer_g(address _from, address _to, uint _value) private {
    require (balances[_from]>=_value, "need enough in your account!");
    balances[_from] = balances[_from] - _value;
    balances[_to] = balances[_to] + _value;
    
    emit Transfer(_from, _to, _value);
    emit BCMevent('transfer', 0,_value, _from, _to);
  }

  
  function transfer(address _to, uint _value) public {
    transfer_g(msg.sender, _to, _value);
  }
  
  function withdrawal(uint _value) public {
    transfer_g(address(this), msg.sender, _value);
  }
  
  function payClaim (uint _claimID) public {
    address claimant = claimsListing[_claimID].submitter;
    uint claimValue = claimsListing[_claimID].value;
    transfer_g(address(this), claimant, claimValue);

    // now they've had a claim
    policyholders[claimant].claims=true;
    // now we're adding the claim information to their data
    policyholders[claimant].paidClaimsData.push([_claimID,claimValue]);
    emit BCMevent('claimPayment', _claimID,claimValue, address(this), claimant);
    portfolioData[1] += claimValue;
    
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
    uint lastDividendDate; // timestamp since last dividend
    uint id; // index of the policyholder in the list of ids
  }
  
  mapping(address=> policyholder) policyholders;
  
  
  // going to need to accumulate a list of policyholders
  // that will mean a policyholder ID number, so if we delete the policyholder
  // we can remove it from the list, too
  

  function getPolicyholderList () public constant returns (address[]) {
    return policyholderList;
  }
  
  function getPolicyholderData (address addy) public constant returns (bool, bool, bool, uint, uint) {
    return (policyholders[addy].current, policyholders[addy].isExist,
	    policyholders[addy].claims,policyholders[addy].lastDividendDate,policyholders[addy].id);
  }
  
  function getPolicyholderVotingRecord (address addy) public constant returns (uint[2][]) {
    return (policyholders[addy].votingRecord);
  }
  
  function getPolicyholderClaimsData (address addy) public constant returns (uint[2][]) {
    return (policyholders[addy].paidClaimsData);
  }

  function getPortfolioData () public constant returns (uint, uint, uint) {
    return (portfolioData[0], portfolioData[1], portfolioData[2]);
  }
  
  function buyPolicy () public {
    
    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    //require(balanceOf(msg.sender) > 100, "you need 100 coins!");
    uint cost = 100;
    transfer(address(this), cost);
    portfolioData[0] += cost;
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
    // add an ID
    policyholders[msg.sender].id=policyholdersCount;
    policyholderList.push(msg.sender);
    
    emit BCMevent('addPolicyholder', policyholdersCount, 0,address(this),msg.sender);
    uint initialBalance = 100;
    withdrawal(initialBalance);
    policyholders[msg.sender].lastDividendDate = block.timestamp;
    
    // type, id, value, from, to
  }

  function deletePolicyholder () public {
    
    // dump the coins back into the bank
    transfer(address(this), balanceOf(msg.sender));

    delete policyholderList[policyholders[msg.sender].id-1];
    delete policyholders[msg.sender];
    policyholdersCount --;
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
  
  
  function issueDividend () public {
    // days since last dividend
    uint divBlocks = (block.timestamp - policyholders[msg.sender].lastDividendDate)/(divBlockTime);
    
    //pull the cash
    uint divAmt=divBlocks * dividendAmount;
    withdrawal(divAmt);
    
    // update the account
    portfolioData[2] += divAmt;
    policyholders[msg.sender].lastDividendDate = block.timestamp;
    emit BCMevent('dividend',0,divAmt, address(this),msg.sender);    
    
  }


  /*
  function catastrophe () public {
    
    // we should have some kind of catastrophic claim hit people, too.
    // and have everyone in the pool eat the losses that spill over from
    // this will need some kind of random element
    // one person's bank

    // if your pool gets wiped out, you loose.
    // if your pool doesn't, your dividend rate bumps up

  }
  */
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
