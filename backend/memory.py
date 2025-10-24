# backend/memory.py
from typing import Dict, Any, List

class Memory:
    def __init__(self):
        self._prefs: Dict[str, Dict[str, Any]] = {}
        self._conv: Dict[str, List[Dict[str, str]]] = {}

    def get_prefs(self, session_id: str) -> Dict[str, Any]:
        return self._prefs.setdefault(session_id, {})

    def set_pref(self, session_id: str, key: str, value: Any) -> None:
        self._prefs.setdefault(session_id, {})[key] = value

    def add_turn(self, session_id: str, user: str, bot: str) -> None:
        self._conv.setdefault(session_id, []).append({"user": user, "bot": bot})

    def get_history(self, session_id: str):
        return self._conv.get(session_id, [])

    def snapshot(self, session_id: str):
        return {
            "prefs": self.get_prefs(session_id),
            "history_size": len(self.get_history(session_id))
        }
