---

## 🖥️ CLI Demo

Below is a sample interaction from the Finance Chatbot’s **command-line interface (CLI)** showing how it processes financial queries using a SQL agent chain.

```bash
PS C:\Users\Faheem\devroom\finance chatbot> python -u "c:\Users\Faheem\devroom\finance chatbot\backend\chatbot.py"
Finance Chatbot (type 'exit' to quit)

You: how much did i spend on Uber
WARNING: All log messages before absl::InitializeLog() is called are written to STDERR
E0000 00:00:1762588049.670269   23464 alts_credentials.cc:93] ALTS creds ignored. Not running on GCP and untrusted ALTS is not enabled.


> Entering new SQL Agent Executor chain...
Action: sql_db_list_tables
Action Input:transactionsAction: sql_db_schema
Action Input: transactions
CREATE TABLE transactions (
        id UUID NOT NULL, 
        user_id TEXT NOT NULL, 
        account_id TEXT, 
        date DATE NOT NULL, 
        amount NUMERIC(14, 2) NOT NULL, 
        currency TEXT DEFAULT 'INR'::text, 
        type TEXT NOT NULL, 
        merchant TEXT, 
        category TEXT, 
        payment_method TEXT, 
        notes TEXT, 
        tags TEXT[] DEFAULT '{}'::text[], 
        CONSTRAINT transactions_pkey PRIMARY KEY (id), 
        CONSTRAINT transactions_type_check CHECK (type = ANY (ARRAY['debit'::text, 'credit'::text]))
)

/*
3 rows from transactions table:
id      user_id account_id      date    amount  currency        type    merchant        category        payment_method  notes   tags
48354a59-9433-4856-96fc-3f09233d1e41    test-user-1     upi-acc-1       2025-10-02      3751.82 INR     debit   Uber    Transport       UPI     DEBIT via UPI - Uber      []
855ed977-ed84-4f6a-afcc-a158cf036d4e    test-user-1     upi-acc-1       2025-10-06      1248.59 INR     debit   Blinkit Groceries       UPI     DEBIT via UPI - Blinkit   []
07c6b511-8e8a-4282-b8b4-014d0ec466ad    test-user-1     upi-acc-1       2025-08-31      216.68  INR     debit   Swiggy  Food    UPI     DEBIT via UPI - Swiggy    []
*/I need to find the total amount spent on Uber. I can do this by summing the 'amount' column from the 'transactions' table where the 'merchant' is 'Uber' and the 'type' is 'debit'.

Action: sql_db_query_checker
Action Input: SELECT SUM(amount) FROM transactions WHERE merchant = 'Uber' AND type = 'debit';SELECT SUM(amount) FROM transactions WHERE merchant = 'Uber' AND type = 'debit';The query looks correct.
= 'Uber' AND type = 'debit';The query looks correct.
Action: sql_db_query
Action Input: SELECT SUM(amount) FROM transactions WHERE merchant = 'Uber' AND type = 'debit';[(Decimal('25017.10'),)]I now know the final answer
Final Answer: I spent 25017.10 on Uber.

> Finished chain.
Bot: {'input': 'how much did i spend on Uber', 'output': 'I spent 25017.10 on Uber.'}
You:
```
<img width="1612" height="940" alt="image" src="https://github.com/user-attachments/assets/70ad1022-f58e-4783-a706-3487b1631029" />

# FastAPI
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/TransactionsDB
CORS_ORIGINS=http://localhost:5173

# Server Config
PORT=8000


