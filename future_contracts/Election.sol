pragma solidity 0.4.24;

// change the name to referendum..? Maybe not necessary, really 

// we'll need a new file and call it BlockChainMutual.sol
// will need to specify the original holder of tokens, initial supply, token name and symbol
// Then we need a way for people to get the tokens
// that will mean calling this token contract from the main contract body

// eventually we'll need to have a 'policyholder' section of the main contract
// that you'll need to pay for in sureCoins and will add you to a register of addresses
// that can vote on the proposals if they choose
// then we can check for whether they have a claim, which perhaps we can structure as an event every other day



contract Election {

  address public owner;
  
  // Constructor
  constructor () public {

    owner = msg.sender;
    addCandidate("Candidate 1");
    addCandidate("Candidate 2");

  }

  // model a candidate
  struct Candidate {
    uint id;
    string name;
    uint voteCount;
  }
  // Read / write candidate
  mapping(uint=> Candidate) public candidates;

  //Store Candidates Count.. can't count it later in sol
  uint public candidatesCount;

  function addCandidate (string _name) private {
    candidatesCount ++;
    candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
  }

  // store accounts that have voted
  mapping(address=> bool) public voters;

  
  // record that this candidate voted
  event votedEvent (
		    uint indexed _candidateId		    
		    );
  
 
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
