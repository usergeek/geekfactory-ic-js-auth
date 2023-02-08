import {Identity} from "@dfinity/agent";
import {AuthClient} from "@dfinity/auth-client";
import {IISource} from "./InternetIdentityAuthProvider";

const TTL = 30 * 24 * 60 * 60 * 1_000_000_000 // 30 days in nanos

const IDLE_TIMEOUT_MILLIS = 20 * 24 * 60 * 60 * 1000 // 20 days in millis

let authClientInstance: AuthClient | undefined = undefined

const provideAuthClient = async (): Promise<AuthClient | undefined> => {
    if (!authClientInstance) {
        const authClient = await AuthClient.create({
                idleOptions: {
                    disableIdle: true,
                    disableDefaultIdleCallback: true,
                    idleTimeout: IDLE_TIMEOUT_MILLIS,
                    onIdle: () => {
                        //nop
                    }
                }
            }
        );
        await authClient.isAuthenticated();
        authClientInstance = authClient
    }
    return authClientInstance
}

const destroyAuthClient = () => {
    authClientInstance = undefined
}

const restoreIdentity = async (authClient: AuthClient): Promise<Identity | undefined> => {
    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
        const identity = await authClient.getIdentity();
        if (!identity.getPrincipal().isAnonymous()) {
            return identity
        }
    }
    await logout(authClient)
}

const login = (authClient: AuthClient, identityProviderURL: string | undefined, source: IISource): Promise<Identity | undefined> => {
    return new Promise((resolve, reject) => {
        const {width: screenWidth, height: screenHeight} = window.screen;
        let windowOpenerFeaturesParams: { left: number, top: number, width: number, height: number } = {
            left: screenWidth / 2 - 200,
            top: screenHeight / 2 - 300,
            width: 400,
            height: 600
        }
        if (source === "NFID") {
            windowOpenerFeaturesParams = {
                left: screenWidth / 2 - 525 / 2,
                top: screenHeight / 2 - 705 / 2,
                width: 525,
                height: 705
            }
        }
        const windowOpenerFeatures =
            `left=${windowOpenerFeaturesParams.left}, ` +
            `top=${windowOpenerFeaturesParams.top},` +
            `toolbar=0,location=0,menubar=0,width=${windowOpenerFeaturesParams.width},height=${windowOpenerFeaturesParams.height}`

        return authClient.login({
            identityProvider: identityProviderURL,
            maxTimeToLive: BigInt(TTL),
            windowOpenerFeatures: windowOpenerFeatures,
            onSuccess: async () => {
                const identity = authClient.getIdentity();
                if (!identity.getPrincipal().isAnonymous()) {
                    resolve(identity);
                } else {
                    resolve(undefined)
                }
            },
            onError: error => {
                reject(error)
            }
        })
    })
}

const logout = async (authClient: AuthClient, options?: { returnTo?: string; }) => {
    await authClient.logout(options)
    destroyAuthClient()
}

export const AuthClientFacade = {
    provideAuthClient: provideAuthClient,
    restoreIdentity: restoreIdentity,
    login: login,
    logout: logout,
}