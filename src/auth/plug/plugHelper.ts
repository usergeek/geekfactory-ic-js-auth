import {Principal} from "@dfinity/principal";
import {IDL} from "@dfinity/candid";
import {ActorSubclass, HttpAgent} from "@dfinity/agent";
import {getGlobalIC} from "../AuthCommon";
import {OneAtATimePromiseFacade} from "geekfactory-js-util";

/*
import {PlugMobileProvider} from '@funded-labs/plug-mobile-sdk'
const isMobile = PlugMobileProvider.isMobileBrowser()
console.error("Plug: PlugMobileProvider isMobile", isMobile);
*/


const host = process.env.NODE_ENV === "development" ? `http://localhost:${process.env.LOCAL_REPLICA_PORT || 4943}` : undefined

const walletOneAtATimePromise = OneAtATimePromiseFacade.create()

const Helper = {
    isAvailable: (): boolean => {
        try { // noinspection EqualityComparisonWithCoercionJS
            return getGlobalWallet() != undefined
        } catch (e) {
            return false
        }
    },

    getLoggedInPrincipal: async (): Promise<Principal | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const connected = await wallet.isConnected()
                if (connected) {
                    return await Helper.getPrincipal()
                }
            }
        } catch (e) {
            console.error("Plug: getLoggedInPrincipal failed", e);
        }
    },

    login: async (whitelist: Array<string> | undefined = undefined): Promise<{
        principal: Principal | undefined
        agent: HttpAgent | undefined
    } | undefined> => {
        try {
            /*if (isMobile) {
                const options = {
                    debug: true, // If you want to see debug logs in console
                    walletConnectProjectId: process.env.PLUG_WALLET_CONNECT_PROJECT_ID, // Project ID from WalletConnect console
                    window: window,
                };
                console.log("Plug: PlugMobileProvider create with options", options);
                const provider = new PlugMobileProvider(options)

                try {
                    await provider.initialize()
                } catch (e) {
                    console.error("Plug: PlugMobileProvider initialize failed", e);
                    // noinspection ExceptionCaughtLocallyJS
                    throw e
                }

                if (!provider.isPaired()) {
                    try {
                        const result = await provider.pair()
                        console.log("Plug: PlugMobileProvider pair result", result);
                    } catch (e) {
                        console.error("Plug: PlugMobileProvider pair failed", e);
                        // noinspection ExceptionCaughtLocallyJS
                        throw e
                    }
                }

                const agent = await provider.createAgent({
                    host: 'https://ic0.app',
                    targets: whitelist ?? [],
                })

                return {
                    principal: await agent.getPrincipal(),
                    agent: agent
                }
            }*/
            const wallet = getGlobalWallet()
            if (wallet) {
                const result = await walletOneAtATimePromise.oneAtATimePromise(() => wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                    timeout: 10000,
                }), "plug_login");
                if (result) {
                    return {
                        principal: await Helper.getPrincipal(),
                        agent: undefined
                    }
                }
            }
        } catch (e) {
            console.error("Plug: login failed", e);
            throw e
        }
    },

    getPrincipal: async (): Promise<Principal | undefined> => {
        const wallet = getGlobalWallet()
        if (wallet) {
            return await wallet.getPrincipal()
        }
        return undefined
    },

    createActor: async <T>(canisterId: string, interfaceFactory: IDL.InterfaceFactory/*, agent?: HttpAgent*/): Promise<ActorSubclass<T> | undefined> => {
        /*if (agent != undefined) {
            try {
                return createActorGeneric<T>(canisterId, interfaceFactory, {}, agent)
            } catch (e) {
                console.error("Plug: createActor using agent failed", {canisterId, interfaceFactory, agent}, e);
                return undefined
            }
        }*/
        const parameters = {
            canisterId: canisterId,
            interfaceFactory: interfaceFactory
        }
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const actor = await walletOneAtATimePromise.oneAtATimePromise<ActorSubclass<T> | undefined>(() => wallet.createActor(parameters), "canisterId_" + canisterId)
                return actor
            }
        } catch (e) {
            console.error("Plug: createActor failed", parameters, e);
        }
        return undefined
    },

    logout: async () => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                await wallet.disconnect()
            }
        } catch (e) {
            console.error("Plug: logout failed", e);
        }
    },

    requestBurnXTC: async (amount: number, toCanisterId: string): Promise<bigint | undefined> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const params = {amount: amount, to: toCanisterId, timeout: 1000};
                return await wallet.requestBurnXTC(params)
            }
        } catch (e) {
            console.error("Plug: requestBurnXTC failed", {amount, toCanisterId}, e);
            throw e;
        }
    },

    requestTransfer: async (to: string, amountE8S: number): Promise<{ height: number }> => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const params = {to: to, amount: amountE8S};
                return await wallet.requestTransfer(params)
            }
        } catch (e) {
            console.error("Plug: requestTransfer failed", {to, amountE8S}, e);
            throw e;
        }
    },
};

export const PlugHelper = Helper

const getGlobalWallet = () => {
    // @ts-ignore
    return getGlobalIC()["plug"]
}