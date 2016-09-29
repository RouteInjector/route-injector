/**
 * Created by gerard on 1/26/16.
 */

export interface IAuthConfig {
    debug:boolean,
    login: {
        stateless: boolean,
        key: string,
        password: string,
        model: string[]
    },
    token:{
        expiration:number,
        refresh_token:boolean,
        persist_refreshtoken:boolean,
        persist_accesstoken:boolean,
        secret:string,
        fields:string[],
        publicFields:string[],
        expiresIn: string,
        logoutInMillis:number
    },
    magicTokens: {
        [tokenName:string]:{
            niceName:string,
            role:string,
            rank:string
        }
    }
}