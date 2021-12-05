import {tokens,EVM_REVERT, ETHER_ADDRESS, ether} from './helpers'
const Token =artifacts.require('./Token')
const Exchange =artifacts.require('./Exchange')

require('chai').use(require('chai-as-promised')).should()

contract ('Exchange', ([deployer, feeAccount, user1, user2])=>{
    let token
    let exchange
    const feePercent = 1

    beforeEach(async()=>{
        //deploy token
        token = await Token.new()
        //transfer some token to user
        token.transfer(user1, tokens(100), {from: deployer})
        //deploy exchange
        exchange = await Exchange.new(feeAccount, feePercent)
    })
 
    describe('deployment',()=>{
        it('tracks the fee account', async()=>{
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })
        it('tracks the fee precent', async()=>{
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('fallback', ()=>{
        it('revert when ether is sent', async ()=>{
            await exchange.sendTransaction({value:1, from: user1}).should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('deposit ether', ()=>{
        let result
        let amount
        beforeEach(async()=>{
            amount = ether(1)
            result = await exchange.depositEther({from:user1, value: amount})
        })
        it ('tracks the ether deposit', async()=>{
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })
        it('emits a deposit event', async()=>{
            const log =result.logs[0] 
            log.event.should.equal('Deposit')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS,'token address is correct')
            event.user.should.equal(user1,'user address is correct')
            event.amount.toString().should.equal(amount.toString(),'Amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })

    describe('withdraw ether', ()=>{
        let result
        let amount
        beforeEach(async()=>{
            amount=ether(1)
            //despoiting ether
            await exchange.depositEther({from:user1, value:amount})
        })
        describe('success', async()=>{
            beforeEach(async()=>{
                //withdraw ether
                result = await exchange.withdrawEther(amount, {from:user1})
            })
            it('Withdraw ether funds', async()=>{
            const balance= await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal('0')
            })
            it('emits a withdraw  event', async()=>{
                const log =result.logs[0] 
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.should.equal(ETHER_ADDRESS)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString(),'Amount is correct')
                event.balance.toString().should.equal('0')
            })
        })
        describe('failure', ()=>{
            it('reject transcation- insufficient balance', async()=>{
                await exchange.withdrawEther(ether(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
                
            })
        })

    })

    describe('depositing the token', ()=>{
        let result
        let amount
        
        describe('Success', ()=>{
            beforeEach(async()=>{
                amount = tokens(10)
                await token.approve(exchange.address, amount, {from: user1})
                result = await exchange.depositToken(token.address, amount, {from:user1})
            })

            it('tracks the token deposit', async()=>{
                let balance
                //check the token balance
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                //checks tokens on exchange
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })
            it('emits a deposit event', async()=>{
                const log =result.logs[0] 
                log.event.should.equal('Deposit')
                const event = log.args
                event.token.should.equal(token.address,'token address is correct')
                event.user.should.equal(user1,'user address is correct')
                event.amount.toString().should.equal(amount.toString(),'Amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })

        describe('failure', ()=>{
            it('reject ether deposits', async()=>{
                //TODO:fill me in ...
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
            })
            it('fails when no tokens are approved', async ()=>{
                //don't approve any tokens before depositing
                await exchange.depositToken(token.address,tokens(100),{from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })        
    })

    describe('Withdraw the token', ()=>{
        let result
        let amount
        
        describe('Success', ()=>{
            beforeEach(async()=>{
                //deposit token first
                amount = tokens(10)
                await token.approve(exchange.address, amount, {from: user1})
                await exchange.depositToken(token.address, amount, {from:user1})

                //withdraw the token
                result = await exchange.withdrawToken(token.address, amount, {from:user1})
            })

            it('withdraw token fund', async()=>{
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal('0')
            })

            it('emits a withdraw  event', async()=>{
                const log =result.logs[0] 
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.should.equal(token.address)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString(),'Amount is correct')
                event.balance.toString().should.equal('0')
            })
        })

        describe('failure', ()=>{
            it('transcation failed: insufficent ether balance', async()=>{
                await exchange.withdrawToken(ETHER_ADDRESS,tokens(100), {from:user1}).should.be.rejectedWith(EVM_REVERT)
            })
            it('transcation failed: insufficent native balance', async()=>{
                await exchange.withdrawToken(token.address,tokens(100), {from:user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balance', ()=>{
        let amountToken
        let amountEther
        beforeEach(async()=>{
            amountToken = tokens(100)
            amountEther = ether(1)
            await exchange.depositEther({from:user1, value:amountEther})
            await token.approve(exchange.address, amountToken, {from: user1})
            await exchange.depositToken(token.address, amountToken, {from:user1})
            
        })
        it('ether balance', async()=>{
            const balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amountEther.toString())
        })
        it('token balance', async()=>{
            const balance = await exchange.balanceOf(token.address, user1)
            balance.toString().should.equal(amountToken.toString())
        })
    })

    describe('making orders', ()=>{
        let result
        beforeEach(async()=>{
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1),{from:user1})
        })

        it('tracks the newly created order', async()=>{
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')
            const order = await exchange.orders('1')
            order.id.toString().should.equal('1','id is correct')
            order.user.should.equal(user1,'user is correct')
            order.tokenGet.should.equal(token.address,'token address is correct')
            order.amountGet.toString().should.equal(tokens(1).toString(),'Amount is correct')
            order.tokenGive.should.equal(ETHER_ADDRESS,'Address is correct')
            order.amountGive.toString().should.equal(ether(1).toString(),'amount is correct')
            order.timestamp.toString().length.should.be.at.least(1,'time is correct')
        })
        it('emits on order event', ()=>{
            const log = result.logs[0]
            log.event.should.equal('Order')
            const event = log.args
            event.id.toString().should.equal('1','is id correct')
            event.user.should.equal(user1,'user is correct')
            event.tokenGet.should.equal(token.address,'token address is correct')
            event.amountGet.toString().should.equal(tokens(1).toString(),'Amount is correct')
            event.tokenGive.should.equal(ETHER_ADDRESS,'Address is correct')
            event.amountGive.toString().should.equal(ether(1).toString(),'amount is correct')
            event.timestamp.toString().length.should.be.at.least(1,'time is correct')
        })
    })

    describe('order action', ()=>{

       beforeEach(async()=>{
           //user1 depoist ether
            await exchange.depositEther({from:user1, value: ether(1)})
            //give token to user2
            await token.transfer(user2, tokens(100),{from: deployer})
            //user2 deposit token only
            await token.approve(exchange.address, tokens(2),{from: user2})
            await exchange.depositToken(token.address, tokens(2),{from: user2})
           //user1 makes an order to buy tokens with ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1),{from:user1})
        })

        describe('filiing order', () =>{
            let result

            describe('Success', async()=>{
                beforeEach(async()=>{
                    //user2 fills order
                    result = await exchange.fillOrder('1', {from:user2})
                })

                it('Exceutes the trade & charge fees', async()=>{
                    let balance
                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                    balance.toString().should.equal(ether(1).toString(), 'user2 received Ether')
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                    balance.toString().should.equal('0', 'user1 ether deducted')
                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.99).toString(), 'user2 tokens deducted with fee applied')
                    const feeAccount = await exchange.feeAccount()
                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().should.equal(tokens(0.01).toString(), 'FeeAccount received fee')
                })
                it('updates filled orders', async()=>{
                    const orderFilled = await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })
                it('emits on "Trade" event', ()=>{
                    const log = result.logs[0]
                    log.event.should.equal('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1','id is correct')
                    event.user.should.equal(user1,'user is correct')
                    event.tokenGet.should.equal(token.address,'tokenGet is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(),'AmountGet is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS,'tokenGive is correct')
                    event.amountGive.toString().should.equal(ether(1).toString(),'amountGive is correct')
                    event.userFill.should.equal(user2, 'userfill is correct')
                    event.timestamp.toString().length.should.be.at.least(1,'time is correct')
                })
            })

            describe('failure', ()=>{
                it('rejects invalid order ids', async()=>{
                    const invalidOrderId = 99999
                    await exchange.fillOrder(invalidOrderId, {from:user2}).should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects already filled orders', async()=>{
                    //fill the order
                    await exchange.fillOrder('1', {from: user2}).should.be.fulfilled
                    //filling the order again
                    await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects cancel orders', async()=>{
                    //cancel the order
                    await exchange.cancelOrder('1', {from:user1}).should.be.fulfilled
                    //try to fill the order
                    await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })

        describe('Cancelling orders', ()=>{
            let result
            describe('success', async()=>{
                
                beforeEach(async()=>{
                    result = await exchange.cancelOrder('1', {from:user1})
                })

                it('updats cancelled order', async()=>{
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })
                it('emits on cancel event', ()=>{
                    const log = result.logs[0]
                    log.event.should.equal('Cancel')
                    const event = log.args
                    event.id.toString().should.equal('1','is id correct')
                    event.user.should.equal(user1,'user is correct')
                    event.tokenGet.should.equal(token.address,'token address is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(),'Amount is correct')
                    event.tokenGive.should.equal(ETHER_ADDRESS,'Address is correct')
                    event.amountGive.toString().should.equal(ether(1).toString(),'amount is correct')
                    event.timestamp.toString().length.should.be.at.least(1,'time is correct')
                })
            })
        })
          
        describe('failure',()=>{
            it('rejects invalid order ids', async()=>{
                const invalidOrderId = 999
                await exchange.cancelOrder(invalidOrderId,{from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
            it('rejects unauthorized cancelations', async()=>{
                //try to cancel the oder form another user
                await exchange.cancelOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT)
            })

        }) 
    })
})