import build_agent

def ask(query: str):
    agent = build_agent()
    return agent.invoke(query)


if __name__ == "__main__":
    print(ask("Show my total spend in Food category this month"))