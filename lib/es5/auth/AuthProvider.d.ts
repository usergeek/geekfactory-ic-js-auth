import { PropsWithChildren } from "react";
import { Principal } from "@dfinity/principal";
import { Source } from "./authSource/AuthSourceProvider";
import { AuthAccount, ContextState, ContextStatus, CreateActorFn, LoginFnResult } from "./AuthCommon";
type LoginParameters = {
    source: Source;
    derivationOrigin?: string | URL;
    maxTimeToLiveNanos?: bigint;
};
type LoginFn = (parameters: LoginParameters) => Promise<LoginFnResult>;
type LogoutFn = (source: Source) => void;
type SwitchAccountFn = (targetAccount: number) => void;
type GetCurrentPrincipalFn = () => Principal | undefined;
type GetCurrentAccountFn = () => AuthAccount | undefined;
interface Context {
    source: Source;
    status: ContextStatus;
    state: ContextState;
    login: LoginFn;
    logout: LogoutFn;
    switchAccount: SwitchAccountFn;
    getCurrentPrincipal: GetCurrentPrincipalFn;
    getCurrentAccount: GetCurrentAccountFn;
    createActor: CreateActorFn;
}
export declare const useAuthProviderContext: () => Context;
type Props = {
    onLogout?: () => void;
};
export declare const AuthProvider: (props: PropsWithChildren<Props>) => JSX.Element;
export {};
