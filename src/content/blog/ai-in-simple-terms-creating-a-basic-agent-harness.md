---
title: "AI in simple terms: creating a basic agent harness"
date: "2026-09-14"
preview: "Hi Guys, as promised in the previous articles, I'm going to show you how to create a dead simple agent harness in this tutorial…"
description: "Build a dead simple agent harness in Python with Gemini: a soul.md system prompt, a context builder for chat history and a REPL loop."
tags: ["ai", "llm"]
---
Hi Guys, As promised in the previous articles, I'm going to show you how to create a dead simple agent harness in this tutorial. For a quick recap of what an agent harness is, please refer to the previous article, [AI in simple terms: what is an agent harness?](/blogs/ai-in-simple-terms-what-is-an-agent-harness)

As we discussed in the last article, there are a few features of an agent harness that matter most:

Persistence : Memory system

Agent loop : The loop that keeps the agent going

Eval framework : Observability

Apart from these, **context engineering**, the **environment** (sandbox) and **tools** are also important. But in this first iteration I'm giving priority to the 3 features mentioned above, and then we'll move on to the next 3 features.

For simplicity when we code, I've rescoped these 3 areas into the following components:

Context builder

LLM model

Model response

Loop ending conditions

Now let's start the coding. The first step is to get the user prompt and prepare the context before sending it to the LLM. For this let's use the following:

System prompt : a **soul.md** file

Recent chat history : keep an array of recent chat history and add it to the context

First we need to be able to load the **soul.md** file. Create an MD file and save it in the same place where your **agent_harness.py** file is located. This is the function that loads it:

```python
import os
from pathlib import Path

SOUL_PATH = Path(__file__).parent / "soul.md"

def load_soul(path: Path = SOUL_PATH) -> str:
    return path.read_text(encoding="utf-8").strip()
```

And this is the **soul.md** I'm using. It gives the agent a name, a personality and a few rules:

```markdown
# Soul

You are Pip, a small, sharp assistant that lives in a terminal.

## Personality

- Direct and warm. No filler, no hedging.
- Curious - ask one clarifying question when a request is ambiguous, otherwise just do it.
- Dry humor is welcome; sarcasm at the user is not.

## Voice

- Short sentences. Plain words.
- Lead with the answer, then explain if needed.
- Use code blocks for code, otherwise mostly prose.

## Rules

- If you don't know something, say so.
- Never invent facts, APIs, or file paths.
- Keep replies under ~150 words unless the user asks for more.
```

Next let's load this into the agent and get a response. Note that the LLM model call, `client.models.generate_content`, covers the second component, `while True:` covers the loop, and `if user_input.lower() in {"quit", "exit"}:` covers the loop ending conditions. What `run_agent` returns is the model response. So we have covered 3 of the 4 components I declared before in this code snippet:

```python
import os
from pathlib import Path

from google import genai
from google.genai import types

# --- Step 1: setup ---------------------------------------------------------
MODEL = "gemini-3.7-flash"
SOUL_PATH = Path(__file__).parent / "soul.md"

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def load_soul(path: Path = SOUL_PATH) -> str:
    return path.read_text(encoding="utf-8").strip()

# --- Step 2: one call, no memory ------------------------------------------
def run_agent(user_input: str, thinking_level: str = "low") -> str:
    response = client.models.generate_content(
        model=MODEL,
        contents=user_input,
        config=types.GenerateContentConfig(
            system_instruction=load_soul(),
            thinking_config=types.ThinkingConfig(thinking_level=thinking_level),
        ),
    )
    return response.text

# --- Step 3: REPL ----------------------------------------------------------
if __name__ == "__main__":
    print(f"[{MODEL}] type 'quit' to exit\n")
    while True:
        user_input = input("you> ").strip()
        if user_input.lower() in {"quit", "exit"}:
            break
        print(f"agent> {run_agent(user_input)}\n")
```

Now we have successfully loaded a system prompt, and you can try running this and getting some responses. What you will notice is that it still doesn't remember what we discussed. So let's write the most important function of this article, the **context_builder**:

```python
def context_builder(soul: str, history: list[dict]) -> tuple[str, list[types.Content]]:
    """
    Turn soul.md + chat history into what Gemini wants.

    history roles: "user" / "assistant"  (mapped to Gemini's "user" / "model")
    """
    role_map = {"user": "user", "assistant": "model", "model": "model"}
    contents = [
        types.Content(
            role=role_map[msg["role"]],
            parts=[types.Part.from_text(text=msg["content"])],
        )
        for msg in history
    ]
    return soul, contents
```

Now based on this, let's change the full code to adapt to the message history. Every user message and every agent reply gets appended to `history`, and the whole thing is sent to the model on each turn:

```python
import os
from pathlib import Path

from google import genai
from google.genai import types

MODEL = "gemini-3.7-flash"
SOUL_PATH = Path(__file__).parent / "soul.md"

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def load_soul(path: Path = SOUL_PATH) -> str:
    return path.read_text(encoding="utf-8").strip()

def context_builder(soul: str, history: list[dict]) -> tuple[str, list[types.Content]]:
    """
    Turn soul.md + chat history into what Gemini wants.

    history roles: "user" / "assistant"  (mapped to Gemini's "user" / "model")
    """
    role_map = {"user": "user", "assistant": "model", "model": "model"}
    contents = [
        types.Content(
            role=role_map[msg["role"]],
            parts=[types.Part.from_text(text=msg["content"])],
        )
        for msg in history
    ]
    return soul, contents

def run_agent(history: list[dict], thinking_level: str = "low") -> str:
    system_prompt, contents = context_builder(load_soul(), history)

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            thinking_config=types.ThinkingConfig(thinking_level=thinking_level),
        ),
    )
    return response.text

if __name__ == "__main__":
    history: list[dict] = []
    print(f"[{MODEL}] type 'quit' to exit\n")
    while True:
        user_input = input("you> ").strip()
        if user_input.lower() in {"quit", "exit"}:
            break
        history.append({"role": "user", "content": user_input})
        reply = run_agent(history)
        history.append({"role": "assistant", "content": reply})
        print(f"agent> {reply}\n")
```

This is the dead simple agent harness anyone can create. In the next articles we can go a bit crazy and try out different ways of creating production grade agents. Happy Coding ;)
