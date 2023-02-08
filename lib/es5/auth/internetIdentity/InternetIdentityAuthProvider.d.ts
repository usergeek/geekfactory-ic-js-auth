import * as React from "react";
import { PropsWithChildren } from "react";
import { Source } from "../authSource/AuthSourceProvider";
import { ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "../AuthCommon";
type LoginFn = (identityProviderURL: string | undefined) => Promise<LoginFnResult>;
type LogoutFn = () => void;
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
    context: React.Context<Context | undefined>;
    source: IISource;
};
export declare const InternetIdentityAuthProvider: (props: PropsWithChildren<Props>) => JSX.Element;
export {};
