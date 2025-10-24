# chat_interface.py
# Simple CLI chat interface to interact with SQL + Gemini agent
from sql_agent import build_agent

def chat():
    print("Finance Chatbot (type 'exit' to quit)\n")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break
        try:
            agent = build_agent()
            if agent is None:
                print("Agent not initialized.")
                continue
            response = agent.invoke(user_input)
            print("Bot:", response)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    chat()
