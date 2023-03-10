import { ErrorUnexpectedResult } from "@1hive/connect-core"
import { QueryResult } from "@1hive/connect-thegraph"
import Transaction from "../../models/Transaction"
import { TransactionData } from "../../types"

export function parseTransactions(result: QueryResult): Transaction[] {
  const transactions = result.data.transactions

  if (!transactions) {
    throw new ErrorUnexpectedResult("Unable to parse transactions.")
  }

  const datas = transactions.map((tx: any): TransactionData => {
    return tx
  })

  return datas.map((data: TransactionData) => {
    return new Transaction(data)
  })
}
