pragma solidity 0.4.24;

// we'll need a new file and call it BlockChainMutual.sol
// will need to specify the original holder of tokens, initial supply, token name and symbol
// Then we need a way for people to get the tokens
// that will mean calling this token contract from the main contract body

// add a policyholder by paying our tokens in
// keep an array for each policyholder
// last digit on each array is whether they're current



contract blockChainMutual {

  address public owner;
  
  // Constructor
  constructor () public {
    owner = msg.sender;
    
  }

  // model a policy holder
  struct policyholder {
    uint policyholderID;
    address polName;
    bool current;
    bool isExist;
  }

  // this array will store the policyholders along with a current or not current flag

  mapping(uint=> policyholder) public policyholders;
  
  //Store policyholder Count.. can't count it later in sol
  uint public policyholdersCount;

  function buyPolicy () private {
    // check if policyholder exists

    if (policyholders[msg.sender].isExist) {
      // if so, increment the current with a True
      addPolicyholder(msg.sender)
	}
    else {
      // else we just make sure the policyholder current flag is true
      // not totally clear that this is going to work!
      policyholders[policyholdersCount] = policyholder(policyholdersCount, msg.sender, true, true);
    }
    policyCount ++;
  }

  function cancelPolicy (msg.sender) private {
    
    policyholders[policyholdersCount] = policyholder(policyholdersCount, _name, false, true);
    policyCount --;
  }
  
  uint public policyCount;
  
  function addPolicyholder (msg.sender) private {
    policyholdersCount ++;
    policyholders[policyholdersCount] = policyholder(policyholdersCount, _name, true, true);
    
  }

  // list of inforce policyholders
   mapping(address=> bool) public inForcePolicyholders;
   
  /* should I adapt this to a claim?
  event votedEvent (
		    uint indexed _candidateId		    
		    );
  */

  // event should be adding a policyholder
   
  function vote (uint _candidateId) public {
    // require that they haven't voted before
    require(!voters[msg.sender]);

    // require a valid candidate
    require(_candidateId > 0 && _candidateId <= candidatesCount);

    // record that voter has voted
    voters[msg.sender]=true;

    // update candidate vote count
    candidates[_candidateId].voteCount ++;

    // trigger voted event
    emit votedEvent(_candidateId);
    
  }

  // self destruct
  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
  }

}
