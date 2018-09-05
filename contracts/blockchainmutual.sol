pragma solidity 0.4.24;

// next we add the ability to submit a claim and vote on claims submitted
// votes attract sureCoins



contract blockChainMutual {
  address public myself;
  address public owner;
  //Store policyholder Count.. can't count it later in the blockchain
  uint public policyholdersCount = 0;
  uint public policyCount = 0;
  mapping(address => uint) public balances; // List of user balances.
  // this array will store the policyholders, including the current flag
  mapping(address=> policyholder) public policyholders;
  
  // Constructor
  constructor () public {
    owner = msg.sender;
    uint decimals = 2;
    uint INITIAL_SUPPLY = 1000000 * (10 ** decimals);    
    balances[address(this)] = INITIAL_SUPPLY;
    myself = address(this);
    // build a policy
    //policyholdersCount ++;
    //policyholders['0x2902c878f6e3EA44316b85f3167d2Ac74b31283a'] = policyholder(true, true);
    
  }
  
  event Transfer(address indexed from, address indexed to, uint value);
  
  function transfer(address _to, uint _value) public {
    balances[msg.sender] = balances[msg.sender] - _value;
    balances[_to] = balances[_to] + _value;
    emit Transfer(msg.sender, _to, _value);
  }

  function withdrawal(uint _value) public {
    
    balances[address(this)] = balances[address(this)] - _value;
    balances[msg.sender] = balances[msg.sender] + _value;
    emit Transfer(address(this), msg.sender, _value);
    
  }
  
  function balanceOf(address _owner) public constant returns (uint balance) {
    return balances[_owner];
  }
  
  // model a policy holder
  struct policyholder {
    bool current;
    bool isExist;
    bool[] claimHistory;
  }

  function buyPolicy () public {

    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    //require(balanceOf(msg.sender) > 100, "you need 100 coins!");
    //transfer(address(this), 100);
    policyholders[msg.sender].current=true;
    policyCount ++;
    
    emit policyEvent();
  }
  
  function cancelPolicy () public {
    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    require(policyholders[msg.sender].current=true, "you don't have a policy!");

    policyholders[msg.sender].current=false;
    policyCount --;
    //delete inForcePolicyholders[msg.sender];
    emit policyEvent();
  }
  
  function addPolicyholder () public {
    policyholdersCount ++;
    policyholders[msg.sender] = policyholder({current:false, isExist:true});
    balances[msg.sender] = 0;
    withdrawal(100);
    //inForcePolicyholders[msg.sender]=true;
    emit policyEvent();
  }

  function deletePolicyholder () public {
    policyholdersCount --;
    // dump the coins back into the bank
    transfer(address(this), balanceOf(msg.sender));
    delete policyholders[msg.sender];
    //inForcePolicyholders[msg.sender]=true;
  }

  
  
  struct claim {
    bool resolved; // whether the vote has happened
    bool valid; // whether the claim is real
    uint value; // amount claimed
    uint votesFor; // votes in favor 
    uint votesCount; // all votes
    address[] voted; // the list of users that have voted on the claim
    address submitter;
  }

  
  
  // the listing of claims
  mapping(uint=> claim) public claimsListing;

  uint claimsCount; // will be used to track the claims ID
  
  // record that we added or canceled a policy
  event policyEvent ();

  function submitClaim (uint value){
    claimsCount ++;
    policyholders[msg.sender].claimHistory.push(); // not sure of the syntax here.. want to keep a list of the policyholder
    claimsListing[claimsCount]=(, , value, ,msg.sender); // also not sure of the syntax
    // would be cool to put together an evaluation page that only the account ID holder can access.
    // that will include the image and write-up of a submitted claim
    // along with some policy information 
    
  }
  
  function claimVote (uint _claimID, bool result) public {
    // require that they haven't voted before
    require(!claimsListing[_claimID].voted); // this is a test of whether the address has voted
    
    // require a valid claim number
    require(_claimID > 0 && _claimID <= claimsCount);
    
    // record that voter has voted
    claimsListing[_claimID].voted[msg.sender]=true;

    // update candidate vote count
    claimsListing[_claimID].votesCount ++;

    // is it for or against?!
    if (result == true){
      claimsListing[_claimID].votesFor ++;
    }
    // trigger event
    emit votedEvent(_claimID);
    
  }
  
  // self destruct
  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
  }

}

