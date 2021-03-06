export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
export const RED = 'danger'
export const GREEN = 'success'

export const DECIMALS = (10**18)
//shortcut to avoid passing around web3 connection 
export const ether =(wei)=>{
    if(wei){
        return(wei /DECIMALS)
    }
}

//tokens and ether have some decimal resolution
export const tokens = ether