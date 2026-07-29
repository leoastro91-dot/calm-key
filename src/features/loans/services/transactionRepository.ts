/**
 * Repository (ADR-001) — transactions para el feature Préstamos a Terceros.
 * Sólo type IN ('loan_given','loan_repayment'). CHECK (amount > 0) en DB.
 * affects_budget SIEMPRE false: un préstamo no es gasto ni ingreso de presupuesto.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";

const COLS = "id, type, amount, date, description, account_id, pocket_id, loan_id";

export interface LoanTransactionRow {
  id: string;
  type: "loan_given" | "loan_repayment";
  amount: number;
  date: string;
  description: string | null;
  account_id: string;
  pocket_id: string;
  loan_id: string;
}

async function insertLoanTransaction(
  type: "loan_given" | "loan_repayment",
  input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    description: string | null;
    account_id: string;
    pocket_id: string;
    loan_id: string;
    financial_period_id: string | null;
  },
): Promise<{ id: string }> {
  if (input.amount <= 0) throw new Error("LOAN_AMOUNT_MUST_BE_POSITIVE");
  const { data, error } = await getSupabase()
    .from("transactions")
    .insert({
      user_id: input.user_id,
      workspace_id: input.workspace_id,
      type,
      amount: input.amount,
      date: input.date,
      description: input.description,
      account_id: input.account_id,
      pocket_id: input.pocket_id,
      to_account_id: null,
      to_pocket_id: null,
      loan_id: input.loan_id,
      category_id: null,
      subcategory_id: null,
      budget_item_id: null,
      financial_period_id: input.financial_period_id,
      spending_nature: "normal",
      affects_budget: false,
      is_onboarding_entry: false,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export const loanTransactionRepository = {
  createLoanGiven: (input: Parameters<typeof insertLoanTransaction>[1]) =>
    insertLoanTransaction("loan_given", input),

  createLoanRepayment: (input: Parameters<typeof insertLoanTransaction>[1]) =>
    insertLoanTransaction("loan_repayment", input),

  async listByLoan(
    userId: string,
    workspaceId: string,
    loanId: string,
  ): Promise<LoanTransactionRow[]> {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("loan_id", loanId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as LoanTransactionRow[]) ?? [];
  },
};
