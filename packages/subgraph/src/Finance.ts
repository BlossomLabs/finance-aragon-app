import { Address, BigInt } from '@graphprotocol/graph-ts'
import {
  NewTransaction as NewTransactionEvent,
  Finance as FinanceContract,
} from '../generated/templates/Finance/Finance'

import {
  Transaction as TransactionEntity,
  TokenBalance as TokenBalanceEntity,
} from '../generated/schema'

export function handleNewTransaction(event: NewTransactionEvent): void {

  const transaction = _getTransactionEntity(
    event.address,
    event.params.transactionId
  )

  _populateTransactionDataFromEvent(transaction, event)
  _populateTransactionDataFromContract(
    transaction,
    event.address,
    event.params.transactionId
  )

  transaction.save()

  const tokenBalance = _getTokenBalanceEntity(
    event.address,
    Address.fromBytes(transaction.token)
  )

  _updateTokenBalance(tokenBalance, transaction)

  tokenBalance.save()
}

function _getTransactionEntity(
  appAddress: Address,
  transactionId: BigInt
): TransactionEntity {
  const transactionEntityId = _getTransactionEntityId(appAddress, transactionId)

  let transaction = TransactionEntity.load(transactionEntityId)
  if (!transaction) {
    transaction = new TransactionEntity(transactionEntityId)

    const finance = FinanceContract.bind(appAddress)

    transaction.orgAddress = finance.kernel()
    transaction.appAddress = appAddress
  }

  return transaction
}

function _getTransactionEntityId(
  appAddress: Address,
  transactionId: BigInt
): string {
  return (
    'appAddress:' +
    appAddress.toHexString() +
    '-transactionId:' +
    transactionId.toHexString()
  )
}

function _getTokenBalanceEntity(
  appAddress: Address,
  token: Address
): TokenBalanceEntity {
  const tokenBalanceEntityId = _getTokenBalanceId(appAddress, token)

  let tokenBalance = TokenBalanceEntity.load(tokenBalanceEntityId)
  if (!tokenBalance) {
    tokenBalance = new TokenBalanceEntity(tokenBalanceEntityId)

    const finance = FinanceContract.bind(appAddress)

    tokenBalance.token = token
    tokenBalance.balance = BigInt.fromI32(0)
    tokenBalance.orgAddress = finance.kernel()
    tokenBalance.appAddress = appAddress
  }

  return tokenBalance
}

function _getTokenBalanceId(appAddress: Address, token: Address): string {
  return (
    'appAddress:' +
    appAddress.toHexString() +
    '-tokenAddress:' +
    token.toHexString()
  )
}

function _populateTransactionDataFromContract(
  transaction: TransactionEntity,
  appAddress: Address,
  transactionId: BigInt
): void {
  const finance = FinanceContract.bind(appAddress)

  const transactionData = finance.getTransaction(transactionId)

  transaction.token = transactionData.value4
  transaction.date = transactionData.value7
}

function _populateTransactionDataFromEvent(
  transaction: TransactionEntity,
  event: NewTransactionEvent
): void {
  transaction.isIncoming = event.params.incoming
  transaction.entity = event.params.entity
  transaction.amount = event.params.amount
  transaction.reference = event.params.reference
  transaction.transactionHash = event.transaction.hash
}

function _updateTokenBalance(
  tokenBalance: TokenBalanceEntity,
  transaction: TransactionEntity
): void {
  if (transaction.isIncoming) {
    tokenBalance.balance = tokenBalance.balance.plus(transaction.amount)
  } else {
    tokenBalance.balance = tokenBalance.balance.minus(transaction.amount)
  }
}
