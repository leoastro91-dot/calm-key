/**
 * Reversa de un traslado entre bolsillos (inversa a useTransferMoney):
 *   1. Validar que el bolsillo destino aún tenga el dinero.
 *   2. DELETE transactions.
 *   3. destino -= X, origen += X; cuentas si son distintas.
 * La ejecución del presupuesto se recalcula al recargar (derivada de transactions).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import type { TransferRow } from "../domain/types";

async function pocketBalance(id: string) {
  const { data, error } = await getSupabase()
    .from("pockets").select("balance").eq("id", id).single();
  if (error) throw error;
  return Number((data as { balance: number }).balance);
}

async function adjustAccount(id: string, delta: number) {
  const { data, error } = await getSupabase()
    .from("accounts").select("current_balance").eq("id", id).single();
  if (error) throw error;
  const next = Number((data as { current_balance: number }).current_balance) + delta;
  const { data: up, error: e2 } = await getSupabase()
    .from("accounts").update({ current_balance: next }).eq("id", id).select("id");
  if (e2) throw e2;
  if (!up?.length) throw new Error("ACCOUNT_BALANCE_UPDATE_FAILED");
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: TransferRow) => {
      if (!tx.to_pocket_id || !tx.to_account_id) throw new Error("INVALID_TRANSFER");
      const amount = Number(tx.amount);
      const destBal = await pocketBalance(tx.to_pocket_id);
      if (destBal < amount) throw new Error("DEST_INSUFFICIENT");

      const { error } = await getSupabase().from("transactions").delete().eq("id", tx.id);
      if (error) throw error;

      const srcBal = await pocketBalance(tx.pocket_id);
      await pocketRepository.setBalance(tx.to_pocket_id, destBal - amount);
      await pocketRepository.setBalance(tx.pocket_id, srcBal + amount);
      if (tx.account_id !== tx.to_account_id) {
        await adjustAccount(tx.to_account_id, -amount);
        await adjustAccount(tx.account_id, amount);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
