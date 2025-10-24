# sql_agent_gemini.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
#from langchain.agents import create_sql_agent
import os
from dotenv import load_dotenv
from langchain_community.agent_toolkits import create_sql_agent

#from langchain_community.agents.agent_types import AgentType
#from langchain.agents import AgentType
def build_agent():
    try:
        load_dotenv()
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise EnvironmentError("GOOGLE_API_KEY not found in .env")
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0
            )
        db = SQLDatabase.from_uri(
            "postgresql+psycopg2://postgres:root@localhost:5432/TransactionsDB"
        )
        agent = create_sql_agent(
            llm=llm,
            db=db,
            
            verbose=True
        )
        return agent
    except Exception as e:
        print(f"Error initializing agent: {e}")
        return None

# if __name__ == "__main__":
#     agent = build_agent()
#     response = agent.invoke("Show my top 5 merchants based on total spending this month")
#     print(response)
