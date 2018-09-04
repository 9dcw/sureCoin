pragma solidity 0.4.24;

// will need to specify the original holder of tokens, initial supply, token name and symbol
// Then we need a way for people to get the tokens
// that will mean calling this token contract from the main contract body

// add a policyholder by paying our tokens in
// keep an array for each policyholder
// last digit on each array is whether they're current

// now we need to issue the ICO upon creation of the company
// then we can put a button on there that says "buy sureCoins"
// then we build the ability to pay for a policy with sureCoins

// later we'll build in the simulator for policyholder performance
// we can have someone log their email address.. is there a way to hash that so I can't even see it?
/*
contract sureCoin  {

  constructor () public {
    //bytes32 name = "sureCoin";
    //bytes32 symbol = "SCO";
    uint decimals = 2;
    // million coins
    uint INITIAL_SUPPLY = 1000000 * (10 ** decimals);
    uint totalSupply = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }
  
  mapping(address => uint) public balances; // List of user balances.
  
  event Transfer(address indexed from, address indexed to, uint value);
  
  function transfer(address _to, uint _value) public {
    balances[msg.sender] = balances[msg.sender] - _value;
    balances[_to] = balances[_to] + _value;
    emit Transfer(msg.sender, _to, _value);
  }
  
  function balanceOf(address _owner) public constant returns (uint balance) {
    return balances[_owner];
  }
}
*/
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
  }

  /*
  function policyholderCheck () public constant returns (bool check) {
    bool innerCheck = false;
    if (policyholders[msg.sender].isExist) {
      innerCheck = true;
    }
    
    return innerCheck;
    }
  */
  function buyPolicy () public {

    require(policyholders[msg.sender].isExist=true, "you need to be a policyholder first!");
    //require(balanceOf(msg.sender) > 100, "you need 100 coins!");
    //transfer(address(this), 100);
    policyholders[msg.sender].current=true;
    policyCount ++;
    //inForcePolicyholders[msg.sender]=true;
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


  
  // store accounts that have voted
  //mapping(address=> bool) public inForcePolicyholders;

  // record that we added or canceled a policy
  event policyEvent ();

  // self destruct
  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
  }

}

