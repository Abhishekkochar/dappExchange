const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

//utils
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
const ether =(n)=>{
    return new web3.utils.BN(
       web3.utils.toWei(n.toString(), 'ether')
    )
}
const tokens = (n)=> ether(n)
const wait =(seconds)=>{
    const milliseconds = seconds *100
    return new Promise(resolve => setTimeout(resolve,milliseconds)) 
}

module.exports = async function(callback){
    try{
        //fetch accounts from wallet - there are unlocked
        const accounts = await web3.eth.getAccounts()

        //fetch the deployed token
        const token = await Token.deployed()
        console.log('token fethced', token.address)
        //fetch the deployed exchange
        const exchange = await Exchange.deployed()
       console.log('Exchange fethced', exchange.address)

       //give tokens to account
       const sender = accounts[0]
       const receiver = accounts[1]
       let amount = web3.utils.toWei('10000', 'ether') //10000 tokens

       await token.transfer(receiver,amount, {from: sender})
       console.log(`Transfered ${amount} tokens from ${sender} to ${receiver}`) 

       //set up exchange user
       const user1 = accounts[0]
       const user2 = accounts[1]
       
       //user1 deposit ether
       amount = 1
       await exchange.depositEther({from:user1, value:ether(amount)})
       console.log(`deposited ${amount} ether from ${user1}`)

       //user2 approves token
       amount = 10000
       await token.approve(exchange.address, tokens(amount), {from: user2})
       console.log(`Approved ${amount} tokens from ${user2}`)

       //user2 desposites token
       await exchange.depositToken(token.address, tokens(amount), {from:user2})
       console.log(`deposited ${amount} tokens from ${user2}`)

       ////////////////////////////////////////////
       //seed Cancelled order

       //user1 make order to get tokens
       let result
       let orderId
       result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from:user1}) 
       console.log(`made order from ${user1}`)

       //user1 cancels order
       orderId = result.logs[0].args.id
       await exchange.cancelOrder(orderId,{from:user1})
       console.log(`Cancelled order from ${user1}`)

       ///////////////////////////////////////////////////////////////////
       //seed filled order

        //user1 maked order
       result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS, ether(0.1), {from:user1}) 
       console.log(`made order from ${user1}`)

       //user2 fills order
       orderId = result.logs[0].args.id
       await exchange.fillOrder(orderId, {from:user2})
       console.log(`filled order from ${user2}`)

       //wait 1 sec
       await wait(1)

       //user1 makes another order
       result = await exchange.makeOrder(token.address, tokens(50), ETHER_ADDRESS, ether(0.01), {from:user1}) 
       console.log(`made order from ${user1}`)

       //user2 fills order
       orderId = result.logs[0].args.id
       await exchange.fillOrder(orderId, {from:user2})
       console.log(`filled order from ${user2}`)

       //wait 1 sec
       await wait(1)

        //user1 makes final order
       result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15), {from:user1}) 
       console.log(`made order from ${user1}`)

       //user2 fills final order
       orderId = result.logs[0].args.id
       await exchange.fillOrder(orderId, {from:user2})
       console.log(`filled order from ${user2}`)

        //wait 1 sec
       await wait(1)

       ///////////////////////////////////////////////////////
       //seed open order

       //user1 makes 10 orders
       for (let i =1; i<=10; i++ ){
           result  = await exchange.makeOrder(token.address, tokens(10* i), ETHER_ADDRESS, ether(0.01), {from:user1})
           console.log(`made order from ${user1}`)
           //wait 1 sec
           await wait(1)
       }

       //user2 makes 10 orders
        for (let i =1; i<=10; i++ ){
           result  = await exchange.makeOrder(ETHER_ADDRESS, ether(0.01), ETHER_ADDRESS, tokens(10* i), {from:user2})
           console.log(`made order from ${user2}`)
           //wait 1 sec
           await wait(1)
       }
    }
    catch(error){
        console.log(error)
    }
    callback()
}