import * as React from "react";
import { PropsWithChildren } from "react";
import { ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "../AuthCommon";
type LoginParameters = {
    derivationOrigin?: string | URL;
    maxTimeToLiveNanos?: bigint;
};
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>;
type LogoutFn = () => void;
export interface Context {
    status: ContextStatus;
    state: ContextState;
    login: LoginFn;
    logout: LogoutFn;
    createActor: CreateActorFn;
}
export declare const NFIDAuthProviderContext: React.Context<Context | undefined>;
export declare const useNFIDAuthProviderContext: () => Context;
type Props = {
    applicationName: string;
    applicationLogo: string;
};
/**
 * @see https://docs.nfid.one/integration/quickstart
 */
export declare const NFIDAuthProvider: (props: PropsWithChildren<Props>) => JSX.Element;
export {};
