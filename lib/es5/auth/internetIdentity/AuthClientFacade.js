"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthClientFacade = void 0;
const auth_client_1 = require("@dfinity/auth-client");
const IDLE_TIMEOUT_MILLIS = 20 * 24 * 60 * 60 * 1000; // 20 days in millis
let authClientInstance = undefined;
const getAuthClient = () => {
    return authClientInstance;
};
const createAuthClient = async () => {
    if (!authClientInstance) {
        const authClient = await auth_client_1.AuthClient.create({
            idleOptions: {
                disableIdle: true,
                disableDefaultIdleCallback: true,
                idleTimeout: IDLE_TIMEOUT_MILLIS,
                onIdle: () => {
                    //nop
                }
            }
        });
        await authClient.isAuthenticated();
        authClientInstance = authClient;
    }
    return authClientInstance;
};
const destroyAuthClient = () => {
    authClientInstance = undefined;
};
const restoreIdentity = async (authClient) => {
    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
        const identity = authClient.getIdentity();
        if (!identity.getPrincipal().isAnonymous()) {
            return identity;
        }
    }
    await logout(authClient);
};
const login = (parameters) => {
    const { authClient, identityProviderURL, derivationOrigin, source, maxTimeToLiveNanos } = parameters;
    console.log("AuthClientFacade: login: will call 'authClient.login' with ", parameters);
    return new Promise((resolve, reject) => {
        const { width: screenWidth, height: screenHeight } = window.screen;
        let windowOpenerFeaturesParams = {
            left: screenWidth / 2 - 200,
            top: screenHeight / 2 - 300,
            width: 400,
            height: 600
        };
        if (source === "NFID") {
            windowOpenerFeaturesParams = {
                left: screenWidth / 2 - 525 / 2,
                top: screenHeight / 2 - 705 / 2,
                width: 525,
                height: 705
            };
        }
        const windowOpenerFeatures = `left=${windowOpenerFeaturesParams.left}, ` +
            `top=${windowOpenerFeaturesParams.top},` +
            `toolbar=0,location=0,menubar=0,width=${windowOpenerFeaturesParams.width},height=${windowOpenerFeaturesParams.height}`;
        return authClient.login({
            identityProvider: identityProviderURL,
            maxTimeToLive: maxTimeToLiveNanos,
            derivationOrigin: derivationOrigin,
            windowOpenerFeatures: windowOpenerFeatures,
            onSuccess: async () => {
                const identity = authClient.getIdentity();
                if (!identity.getPrincipal().isAnonymous()) {
                    resolve(identity);
                }
                else {
                    resolve(undefined);
                }
            },
            onError: error => {
                console.error("AuthClientFacade: authClient.login(...) caught error", error);
                reject(error);
            }
        });
    });
};
const logout = async (authClient, options) => {
    await authClient.logout(options);
    destroyAuthClient();
};
exports.AuthClientFacade = {
    getAuthClient: getAuthClient,
    createAuthClient: createAuthClient,
    restoreIdentity: restoreIdentity,
    login: login,
    logout: logout,
};
//# sourceMappingURL=AuthClientFacade.js.map