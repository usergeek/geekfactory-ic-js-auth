import * as React from "react";
import {PropsWithChildren, useCallback, useState} from "react";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {KeyValueStoreFacade} from "geekfactory-ic-js-util";

let provideStore = (namespace: string) => {
    const keyValueStore = KeyValueStoreFacade.createStore(namespace);
    provideStore = () => keyValueStore
    return keyValueStore
}

export type Source = "II" | "Plug" | "Stoic" | "NFID" | "InfinityWallet" | undefined

type SetSourceFn = (source: Source) => void

interface Context {
    source: Source
    setSource: SetSourceFn
}

const AuthSourceProviderContext = React.createContext<Context | undefined>(undefined)
export const useAuthSourceProviderContext = () => {
    const context = React.useContext<Context | undefined>(AuthSourceProviderContext)
    if (!context) {
        throw new Error("useAuthSourceProviderContext must be used within a AuthSourceProviderContext.Provider")
    }
    return context;
};

const LOCAL_STORAGE__KEY__SOURCE = "key__source";

export const AuthSourceProvider = (props: PropsWithChildren<{ storeNamespace: string }>) => {

    const [source, setSource] = useState<Source>(() => {
        return provideStore(props.storeNamespace).get(LOCAL_STORAGE__KEY__SOURCE)
    })

    const setSourceFn: SetSourceFn = useCallback<SetSourceFn>((source: Source) => {
        const store = provideStore(props.storeNamespace)
        if (source) {
            store.set(LOCAL_STORAGE__KEY__SOURCE, source)
        } else {
            store.remove(LOCAL_STORAGE__KEY__SOURCE)
        }
        setSource(source)
    }, [props.storeNamespace])

    const value = useCustomCompareMemo<Context, [
        Source,
        SetSourceFn
    ]>(() => ({
        source: source,
        setSource: setSourceFn
    }), [
        source,
        setSource,
    ], _.isEqual)

    return <AuthSourceProviderContext.Provider value={value}>
        {props.children}
    </AuthSourceProviderContext.Provider>
}