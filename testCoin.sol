pragma solidity ^0.4.18; // I guess?


contarct testCoin {
    /* creates an array of all the balances */
    mapping (address => uint256) public balanceOf;
    
    /* initializes contract with initial supply of tokens to the creator */
    function testCoin(uint256 initialSupply) public {
        balanceOf[msg.sender] = initialSupply; // give creator all the tokens
        
    }
    
    /* send coins */
    function transfer(address _to, uint256 _value) public {
        require(balanceOf[msg.sender] >= _value); // check if sender has enough coins
        require(balanceOf[_to] + value >= balanceOf[_to]); // check for overflows
        balanceOf[msg.sender] -= _value; // subtract from sender
        balanceOf[_to] += _value; // add to receiver
    }
}