---
title: "AI in simple terms: what is an agent harness?"
date: "2026-08-27"
preview: "Hi Guys, in this article I'm going to simply describe what an AI harness is. Everybody is so overwhelmed with so many buzzwords, so this one is to make it easy for anyone using a coding agent to understand what they are really using…"
description: "An agent harness is what wraps an LLM with tools, memory, an environment and a loop. Two small Gemini snippets show why a bare model isn't enough."
tags: ["ai", "llm"]
mediumUrl: "https://medium.com/@billacode/ai-in-simple-terms-what-is-an-agent-harness-c093f02547e2"
---
Hi Guys, In this article I'm going to simply describe what an AI harness is. Everybody is so overwhelmed with so many buzz words, so this tutorial is to make it easy for anyone who is using a coding agent to understand what they are really using.

LLMs are still a mathematical model running inside GPUs (most cases) to predict the next token. Yes they have come a lot further than this, but that's the gist of it. So if you input something into an LLM it will give you a response based on the data it was initially trained on and the context. **Context** is simply what we are sending to the LLM. Most frontier models have a 1 million token context these days. And the process from prompt to response is called an **agent run**.

So how do all the chat agents nowadays provide you with up to date information? It's totally because of the harness. So FYI, the chat portal you use to chat with ChatGPT, Gemini or Claude is no longer a chatbot. It's an agent with a harness.

> An agent harness is the system wrapped around an LLM that gives it tools, memory, an environment, an execution loop, and rules for deciding how to use them.

Before talking about a harness we need to know why we need a harness. You create a simple Gemini code snippet like this and prompt the LLM to read a file in the folder this code is running in. Good thing about both of these examples is that you can do it using Google AI Studio's free API keys.

First, export your key:

```bash
export GEMINI_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Then this is the snippet that asks the model to read a local file and summarise it:

```python
from google import genai

client = genai.Client()

interaction = client.interactions.create(
    model="gemini-3.7-flash",
    input="Read the file README.md and create a summarized md doc"
)

print(interaction.output_text)
```

And this is what comes back:

```text
I don't have direct access to your local files.

Please **paste the contents of your `README.md` file here**, and I will generate a clean, structured Markdown summary for you right away!
```

You can see the LLM doesn't have that capability unless we add it explicitly. So you can try the following code to see the next fallback. We ask the model two questions at two different times, where the second question is an extension of the first one:

```python
from google import genai

client = genai.Client()

interaction_1 = client.interactions.create(
    model="gemini-3.7-flash",
    input="My name is Dimuthu Wickramanayake"
)

interaction_2 = client.interactions.create(
    model="gemini-3.7-flash",
    input="What is my name"
)

print(interaction_1.output_text)
print(interaction_2.output_text)
```

And here are the two answers, back to back:

```text
Hello Dimuthu! It's a pleasure to meet you. How can I help you today?
I don't know your name because I don't have access to your personal information. What should I call you?
```

The model can't remember what you asked first. **Persistence is not there** unless we add that information to the context. So the harness should support this as the first thing. That's when all the buzz words like RAG, working memory, system prompts and episodic memory come in.

And then the **environment**. An agent needs an environment to execute certain things — a sandboxed environment to run code and do web searches.

Then the most important thing of all, the **agent loop**. If an agent didn't have a loop, a prompt would do one LLM call and produce a response. So the agent loop is what makes it call tools and access long term memory until an ending condition is met. It's what optimises the prompt result, or performs the task the prompt asked it to do.

Last but not least, the **evaluation** part. LLMs by rights should be deterministic but due to a lot of reasons they are not. And moreover, for different tasks the way we need to call the model would be different. Configs like model temperature increase the randomness of the answer. That's why most agent workflows set temperature to zero — that's the best config to make it as deterministic as possible. To adjust these, and also to fight any security issues or other issues, observation and evaluation is very important. That is how new agent versions get better.

![Diagram of an agent harness: prompt and context feeding an LLM model, with system prompt, episodic memory and RAG backed by MD files, SQLite/MongoDB and Qdrant; a tool and sandbox loop above; and a separate evaluation harness of trace, eval and release feeding new agent versions back in](./images/ai-in-simple-terms-what-is-an-agent-harness/1.png)

_Everything around the model is the harness_

Clear enough yet? Then wait for the next tutorial on how we create our first AI agent harness. Happy Coding ;P
