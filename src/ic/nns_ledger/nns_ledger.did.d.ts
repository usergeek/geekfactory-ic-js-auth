import type {Principal} from '@dfinity/principal';

export interface Account {
    'owner': Principal,
    'subaccount': [] | [Array<number>],
}

export interface AccountBalanceArgs {
    'account': string
}

export interface ArchiveInfo {
    'canister_id': Principal
}

export interface ArchiveOptions {
    'num_blocks_to_archive': bigint,
    'max_transactions_per_response': [] | [bigint],
    'trigger_threshold': bigint,
    'max_message_size_bytes': [] | [bigint],
    'cycles_for_archive_creation': [] | [bigint],
    'node_max_memory_size_bytes': [] | [bigint],
    'controller_id': Principal,
}

export interface ArchivedBlocksRange {
    'callback': [Principal, string],
    'start': bigint,
    'length': bigint,
}

export interface Archives {
    'archives': Array<ArchiveInfo>
}

export interface BinaryAccountBalanceArgs {
    'account': Array<number>
}

export interface BlockRange {
    'blocks': Array<CandidBlock>
}

export interface CandidBlock {
    'transaction': CandidTransaction,
    'timestamp': TimeStamp,
    'parent_hash': [] | [Array<number>],
}

export type CandidOperation = {
    'Approve': {
        'fee': Tokens,
        'from': Array<number>,
        'allowance': Tokens,
        'expires_at': [] | [TimeStamp],
        'spender': Array<number>,
    }
} |
    { 'Burn': { 'from': Array<number>, 'amount': Tokens } } |
    { 'Mint': { 'to': Array<number>, 'amount': Tokens } } |
    {
        'Transfer': {
            'to': Array<number>,
            'fee': Tokens,
            'from': Array<number>,
            'amount': Tokens,
        }
    } |
    {
        'TransferFrom': {
            'to': Array<number>,
            'fee': Tokens,
            'from': Array<number>,
            'amount': Tokens,
            'spender': Array<number>,
        }
    };

export interface CandidTransaction {
    'memo': bigint,
    'icrc1_memo': [] | [Array<number>],
    'operation': CandidOperation,
    'created_at_time': TimeStamp,
}

export interface Decimals {
    'decimals': number
}

export interface Duration {
    'secs': bigint,
    'nanos': number
}

export interface GetBlocksArgs {
    'start': bigint,
    'length': bigint
}

export type GetBlocksError = {
    'BadFirstBlockIndex': {
        'requested_index': bigint,
        'first_valid_index': bigint,
    }
} |
    { 'Other': { 'error_message': string, 'error_code': bigint } };

export interface LedgerCanisterInitPayload {
    'send_whitelist': Array<Principal>,
    'token_symbol': [] | [string],
    'transfer_fee': [] | [Tokens],
    'minting_account': string,
    'transaction_window': [] | [Duration],
    'max_message_size_bytes': [] | [bigint],
    'icrc1_minting_account': [] | [Account],
    'archive_options': [] | [ArchiveOptions],
    'initial_values': Array<[string, Tokens]>,
    'token_name': [] | [string],
}

export interface Name {
    'name': string
}

export interface QueryBlocksResponse {
    'certificate': [] | [Array<number>],
    'blocks': Array<CandidBlock>,
    'chain_length': bigint,
    'first_block_index': bigint,
    'archived_blocks': Array<ArchivedBlocksRange>,
}

export type Result = { 'Ok': bigint } |
    { 'Err': TransferError };
export type Result_1 = { 'Ok': bigint } |
    { 'Err': TransferError_1 };

export interface SendArgs {
    'to': string,
    'fee': Tokens,
    'memo': bigint,
    'from_subaccount': [] | [Array<number>],
    'created_at_time': [] | [TimeStamp],
    'amount': Tokens,
}

export interface StandardRecord {
    'url': string,
    'name': string
}

export interface Symbol {
    'symbol': string
}

export interface TimeStamp {
    'timestamp_nanos': bigint
}

export interface Tokens {
    'e8s': bigint
}

export interface TransferArg {
    'to': Account,
    'fee': [] | [bigint],
    'memo': [] | [Array<number>],
    'from_subaccount': [] | [Array<number>],
    'created_at_time': [] | [bigint],
    'amount': bigint,
}

export interface TransferArgs {
    'to': Array<number>,
    'fee': Tokens,
    'memo': bigint,
    'from_subaccount': [] | [Array<number>],
    'created_at_time': [] | [TimeStamp],
    'amount': Tokens,
}

export type TransferError = {
    'GenericError': { 'message': string, 'error_code': bigint }
} |
    { 'TemporarilyUnavailable': null } |
    { 'BadBurn': { 'min_burn_amount': bigint } } |
    { 'Duplicate': { 'duplicate_of': bigint } } |
    { 'BadFee': { 'expected_fee': bigint } } |
    { 'CreatedInFuture': { 'ledger_time': bigint } } |
    { 'TooOld': null } |
    { 'InsufficientFunds': { 'balance': bigint } };
export type TransferError_1 = {
    'TxTooOld': { 'allowed_window_nanos': bigint }
} |
    { 'BadFee': { 'expected_fee': Tokens } } |
    { 'TxDuplicate': { 'duplicate_of': bigint } } |
    { 'TxCreatedInFuture': null } |
    { 'InsufficientFunds': { 'balance': Tokens } };

export interface TransferFee {
    'transfer_fee': Tokens
}

export type Value = { 'Int': bigint } |
    { 'Nat': bigint } |
    { 'Blob': Array<number> } |
    { 'Text': string };

export interface _SERVICE {
    'account_balance': (arg_0: BinaryAccountBalanceArgs) => Promise<Tokens>,
    'account_balance_dfx': (arg_0: AccountBalanceArgs) => Promise<Tokens>,
    'archives': () => Promise<Archives>,
    'decimals': () => Promise<Decimals>,
    'icrc1_balance_of': (arg_0: Account) => Promise<bigint>,
    'icrc1_decimals': () => Promise<number>,
    'icrc1_fee': () => Promise<bigint>,
    'icrc1_metadata': () => Promise<Array<[string, Value]>>,
    'icrc1_minting_account': () => Promise<[] | [Account]>,
    'icrc1_name': () => Promise<string>,
    'icrc1_supported_standards': () => Promise<Array<StandardRecord>>,
    'icrc1_symbol': () => Promise<string>,
    'icrc1_total_supply': () => Promise<bigint>,
    'icrc1_transfer': (arg_0: TransferArg) => Promise<Result>,
    'name': () => Promise<Name>,
    'query_blocks': (arg_0: GetBlocksArgs) => Promise<QueryBlocksResponse>,
    'send_dfx': (arg_0: SendArgs) => Promise<bigint>,
    'symbol': () => Promise<Symbol>,
    'transfer': (arg_0: TransferArgs) => Promise<Result_1>,
    'transfer_fee': (arg_0: {}) => Promise<TransferFee>,
}