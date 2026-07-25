/**
 * Dominio del feature Movimientos Internos (LOVABLE-005 v1.1).
 * Reutiliza tipos de accounts y define los propios de traslado.
 */
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Category } from "@/features/budget/domain/types";

export type TransferType = "transfer" | "emergency_use";

export interface TransferRow {
  id: string;
  type: TransferType;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string | null;
  account_id: string;
  pocket_id: string;
  to_account_id: string | null;
  to_pocket_id: string | null;
  category_id: string | null;
}

export interface TransferHistoryItem extends TransferRow {
  fromAccount: Account | null;
  fromPocket: Pocket | null;
  toAccount: Account | null;
  toPocket: Pocket | null;
  category: Pick<Category, "id" | "name" | "block_5030"> | null;
}
