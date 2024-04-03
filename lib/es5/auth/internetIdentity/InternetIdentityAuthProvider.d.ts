import * as React from "react";
import { PropsWithChildren } from "react";
import { Source } from "../authSource/AuthSourceProvider";
import { ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "../AuthCommon";
type LoginParameters = {
    derivationOrigin?: string | URL;
    maxTimeToLiveNanos?: bigint;
};
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>;
type LogoutFn = () => Promise<void>;
export interface Context {
    status: ContextStatus;
    state: ContextState;
    login: LoginFn;
    logout: LogoutFn;
    createActor: CreateActorFn;
}
export declare const InternetIdentityAuthProviderContext: React.Context<Context | undefined>;
export declare const useInternetIdentityAuthProviderContext: () => Context;
export type IISource = Extract<Source, "II" | "NFID">;
type Props = {
    identityProviderURL?: string;
};
export declare const InternetIdentityAuthProvider: (props: PropsWithChildren<Props>) => React.JSX.Element;
export {};
