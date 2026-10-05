---
title: "AI in simple terms: building an autonomous agent system with CrewAI, BabyAGI and AutoGen"
date: "2026-10-05"
preview: "Hi Guys, in the last article we built a dead simple agent harness with one loop and one way to stop it. This time we look at how BabyAGI, CrewAI and AutoGen turn that into a system that plans and works on its own, and at what keeps it from running forever…"
description: "CrewAI, BabyAGI and AutoGen compared for building an autonomous agent system on Gemini: task loops, crews, teams and the guardrails they need."
tags: ["ai", "llm"]
draft: false
---
Hi Guys, in the last article we built [a dead simple agent harness](/blogs/ai-in-simple-terms-creating-a-basic-agent-harness) in Python on Gemini, with a `soul.md` system prompt, a context builder for chat history and a `while True:` loop. This time we look at three names that keep coming up whenever someone says "autonomous agents": **BabyAGI**, **CrewAI** and **AutoGen**. I'll explain the idea behind each one, show a small piece of code, compare them and tell you which one I'd pick.

At the end of that post I promised we'd go a bit crazy, so here we are. If you missed the theory behind the harness, start with [what is an agent harness?](/blogs/ai-in-simple-terms-what-is-an-agent-harness), and for how agents should reach your tools safely, see [what is an MCP server?](/blogs/ai-in-simple-terms-what-is-an-mcp-server)

## From one loop to an autonomous system

Our harness has one loop and one stop condition: you type `quit`. A human decides every next step. That's a chat agent, not an autonomous one.

An autonomous system takes the human out of most of those steps. To do that it needs five things:

- **A goal.** One objective, not a stream of chat messages.
- **A plan or task loop.** Something that decides what to do next, and does it again and again.
- **Multiple roles.** A researcher, a writer, a reviewer. Different system prompts with different jobs.
- **Tools.** Web search, file access, APIs. Without them the agents can only talk to each other.
- **A stop condition.** Something that says "we're done" or "we've spent enough".

The last one is the one people forget. Every framework below is really an answer to two questions: **who decides what happens next, and who decides when to stop?**

## BabyAGI: the pattern, and why it never stops

BabyAGI is the one that made "autonomous agent" a thing back in 2023. It's still the clearest way to understand the pattern, because the whole idea fits in one loop with three agents:

- **Execution agent:** completes the current task, given the objective and some context.
- **Task-creation agent:** creates new tasks "based on the objective and the result of the previous task."
- **Prioritization agent:** reorders the task list.

Results go into a vector database (Chroma or Weaviate) so later tasks can pull them back in as context. Then it loops until the task list is empty.

Here's the main loop from the [original repo](https://github.com/yoheinakajima/babyagi_archive/blob/main/babyagi.py). I've trimmed out the print statements so the logic stands out:

```python
def main():
    loop = True
    while loop:
        # As long as there are tasks in the storage...
        if not tasks_storage.is_empty():
            # Step 1: Pull the first incomplete task
            task = tasks_storage.popleft()

            # Send to execution function to complete the task based on the context
            result = execution_agent(OBJECTIVE, str(task["task_name"]))

            # Step 2: Enrich result and store in the results storage
            enriched_result = {
                "data": result
            }

            result_id = f"result_{task['task_id']}"

            results_storage.add(task, result, result_id)

            # Step 3: Create new tasks and re-prioritize task list
            new_tasks = task_creation_agent(
                OBJECTIVE,
                enriched_result,
                task["task_name"],
                tasks_storage.get_task_names(),
            )

            for new_task in new_tasks:
                new_task.update({"task_id": tasks_storage.next_task_id()})
                tasks_storage.append(new_task)

            if not JOIN_EXISTING_OBJECTIVE:
                prioritized_tasks = prioritization_agent()
                if prioritized_tasks:
                    tasks_storage.replace(prioritized_tasks)

            time.sleep(5)
        else:
            print('Done.')
            loop = False
```

Look at the stop condition. The only way out is `tasks_storage.is_empty()`. But on every pass the task-creation agent is asked to "return a list of tasks to be completed in order to meet the objective", and a model asked for more tasks will nearly always give you more. So the list almost never empties. There's no iteration cap, no budget and no "is the objective met?" check. The only throttle is `time.sleep(5)`.

That's where BabyAGI's "it runs forever and burns your API credits" reputation comes from. The README even warns that "Running this script continuously can result in high API usage". **"Task list empty" is not a stop condition you can trust, because the model controls the task list.** Keep that in mind. It's the main lesson of this whole article.

### Where BabyAGI is today

Don't `pip install babyagi` expecting that loop. A lot has moved:

- The original task loop is archived at [babyagi_archive](https://github.com/yoheinakajima/babyagi_archive) as a September 2024 snapshot.
- The current [babyagi repo](https://github.com/yoheinakajima/babyagi) is **functionz**, "an experimental framework for a self-building autonomous agent". Its README says plainly: "Not meant for production use."
- **BabyAGI 3** lives in a separate repo, [babyagi3](https://github.com/yoheinakajima/babyagi3). It's a personal assistant you configure once and then talk to: memory, scheduled tasks, email and SMS, and tools it creates for itself. It defaults to Anthropic, and its own README warns about cost and about hardening it before you expose it beyond localhost.

So BabyAGI is a great thing to learn from. It isn't a library you build a multi-agent product on.

## CrewAI: roles, tasks and crews

[CrewAI](https://docs.crewai.com/en/concepts/crews) is the most readable of the three, because it models the problem the way you'd explain it to a person. It's actively developed (1.15.23 came out on 2026-09-28) and needs Python 3.10 to 3.13.

There are three ideas:

- **Agent:** a worker with a `role`, a `goal`, a `backstory`, some `tools` and an `llm`. Each agent has its own reasoning loop, capped by `max_iter` (default 25).
- **Task:** a unit of work with a `description`, an `expected_output` and the `agent` who does it.
- **Crew:** a team of agents and tasks, run by a **process**.

There are two processes. `Process.sequential` runs the tasks in order, so the crew stops on its own when the last task is done. That's already a better stop condition than BabyAGI's. `Process.hierarchical` adds a manager that plans, delegates to the other agents and checks their work. That needs a `manager_llm` or a `manager_agent`.

### A minimal crew on Gemini

Since my projects run on Gemini, the first thing to do is install the Gemini extra:

```bash
uv add "crewai[google-genai]"
```

Then set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) and create an `LLM`. The CrewAI docs use `gemini/gemini-3.6-flash`, but I've used `gemini-3.7-flash` to match the harness post. In CrewAI 1.15.23, any `gemini/gemini-...` name goes to the native Gemini provider, so 3.7 works too.

One catch: CrewAI doesn't check that Google actually serves the model you name, so a typo only shows up on the first call. Here's the `LLM`:

```python
from crewai import LLM

llm = LLM(
    model="gemini/gemini-3.7-flash",
    api_key="your-api-key",
)
```

This is the crew example from the docs with `llm=llm` passed to each agent. Two agents, two tasks, run in sequence:

```python
from crewai import Agent, Crew, Task, Process

class YourCrewName:
    def agent_one(self) -> Agent:
        return Agent(
            role="Data Analyst",
            goal="Analyze data trends in the market",
            backstory="An experienced data analyst with a background in economics",
            llm=llm,
            verbose=True
        )

    def agent_two(self) -> Agent:
        return Agent(
            role="Market Researcher",
            goal="Gather information on market dynamics",
            backstory="A diligent researcher with a keen eye for detail",
            llm=llm,
            verbose=True
        )

    def task_one(self) -> Task:
        return Task(
            description="Collect recent market data and identify trends.",
            expected_output="A report summarizing key trends in the market.",
            agent=self.agent_one()
        )

    def task_two(self) -> Task:
        return Task(
            description="Research factors affecting market dynamics.",
            expected_output="An analysis of factors influencing the market.",
            agent=self.agent_two()
        )

    def crew(self) -> Crew:
        return Crew(
            agents=[self.agent_one(), self.agent_two()],
            tasks=[self.task_one(), self.task_two()],
            process=Process.sequential,
            verbose=True
        )

YourCrewName().crew().kickoff(inputs={})
```

**A warning about that `llm=llm` line.** If you leave it out, CrewAI doesn't complain. It quietly falls back to whatever `MODEL`, `MODEL_NAME` or `OPENAI_MODEL_NAME` says, or to OpenAI's `"gpt-4.1-mini"`. So you think you're running on Gemini, and you're actually sending your prompts to OpenAI, or getting auth errors you don't understand. Set `llm` on every agent.

Switching to the hierarchical process is a small change. This is the docs' version:

```python
from crewai import Crew, Process

crew = Crew(
    agents=my_agents,
    tasks=my_tasks,
    process=Process.hierarchical,
    manager_llm="gpt-4o"
    # or
    # manager_agent=my_manager_agent
)
```

Note the `"gpt-4o"` there: that's another place an OpenAI model sneaks in. `manager_llm` takes an `LLM` object as well as a string, so on Gemini just pass `manager_llm=llm`. Also keep in mind that a manager is an extra layer of LLM calls on top of every task, so you pay for it in tokens and latency.

### Flows: putting the fuzzy part inside a box

The part of CrewAI I like most is **Flows**. A Flow is plain, event-driven Python that sits above your crews. You decide the order with decorators: `@start` for the first step, `@listen` to run after another step, and `@router` to branch. State is a Pydantic model.

Here's the router example from the [Flows docs](https://docs.crewai.com/en/concepts/flows):

```python
import random
from crewai.flow.flow import Flow, listen, router, start
from pydantic import BaseModel

class WorkflowState(BaseModel):
    priority_flag: bool = False

class PriorityRouter(Flow[WorkflowState]):
    @start()
    def assess_priority(self):
        self.state.priority_flag = random.choice([True, False])

    @router(assess_priority)
    def route_task(self):
        return "urgent" if self.state.priority_flag else "standard"

    @listen("urgent")
    def handle_urgent(self):
        print("Processing urgent request")

    @listen("standard")
    def handle_standard(self):
        print("Processing standard request")

flow = PriorityRouter()
flow.kickoff()
```

Replace those `print` calls with crew kickoffs and you get the shape I want for an autonomous system. The LLMs do the fuzzy work inside each step, and your code decides what runs next and when it ends. Flows also give you `@persist` to keep state across restarts and `@human_feedback` to pause and wait for a person to approve or reject.

One thing to know: CrewAI moves fast. The quickstart docs now show a Flow project (`crewai create flow latest-ai-flow`) with JSONC config files. But when I ran that command on 1.15.23 it still generated YAML (`agents.yaml`, `tasks.yaml`), like most older tutorials. So don't be surprised if a tutorial doesn't match what you see.

## AutoGen: agents that talk until a condition says stop

[AutoGen](https://github.com/microsoft/autogen) from Microsoft takes a different view. Instead of tasks, you build a **team** of agents that have a conversation. A `RoundRobinGroupChat` gives them turns in a fixed order, and a `SelectorGroupChat` lets an LLM pick who speaks next. The usual example is a writer and a critic going back and forth until the critic says "APPROVE".

What AutoGen got really right is **termination conditions**. There are 11 built in, including `MaxMessageTermination`, `TextMentionTermination`, `TokenUsageTermination` and `TimeoutTermination`, and you combine them with `|` (OR) and `&` (AND). This is the example from the [termination docs](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html):

```python
from autogen_agentchat.conditions import MaxMessageTermination, TextMentionTermination

max_msg_termination = MaxMessageTermination(max_messages=10)
text_termination = TextMentionTermination("APPROVE")
combined_termination = max_msg_termination | text_termination
```

Read that as: stop when the critic approves, **or** after 10 messages, whichever comes first. The model gets to end things early, but a hard cap ends them anyway. That's exactly what BabyAGI was missing.

### But don't start a new project on it

I need to be plain here. **AutoGen is in maintenance mode.** Its README says it "will not receive new features or enhancements and is community managed going forward", and "New users should start with Microsoft Agent Framework." The last release, `autogen-agentchat` 0.7.5, came out on 2025-09-30, and nothing has shipped since. Gemini only works through Google's OpenAI-compatible endpoint, and the docs' Gemini examples still use gemini-1.5 models.

### Microsoft Agent Framework, the successor

[Microsoft Agent Framework](https://devblogs.microsoft.com/agent-framework/microsoft-agent-framework-version-1-0/) is built by the AutoGen and Semantic Kernel teams. Version 1.0 shipped on 2026-04-03 with stable APIs and long-term support, and the Python package `agent-framework` is at 1.20.0 now.

It comes with ready-made orchestrations: sequential, concurrent, handoff, group chat and Magentic-One. The group chat is the closest match to an AutoGen team. Termination is now a plain Python function over the conversation instead of a class.

Gemini support exists, but **it's a pre-release package**, so you need `--pre`:

```bash
pip install agent-framework-gemini --pre
```

Then set `GOOGLE_API_KEY` and `GOOGLE_MODEL`. It has to be `GOOGLE_API_KEY`: unlike CrewAI, this client ignores `GEMINI_API_KEY`.

Here's a researcher and a writer taking turns, adapted from the [group chat docs](https://learn.microsoft.com/en-us/agent-framework/workflows/orchestrations/group-chat). The docs build the client with Azure's `FoundryChatClient`, and I've swapped in `GeminiChatClient()`. It's built on the same `BaseChatClient` as the Azure one, and the whole group chat below builds with it. First the client and the two agents:

```python
from agent_framework import Agent
from agent_framework.gemini import GeminiChatClient

client = GeminiChatClient()

# Create a researcher agent
researcher = Agent(
    client=client,
    name="Researcher",
    description="Collects relevant background information.",
    instructions="Gather concise facts that help answer the question. Be brief and factual.",
)

# Create a writer agent
writer = Agent(
    client=client,
    name="Writer",
    description="Synthesizes polished answers using gathered information.",
    instructions="Compose clear, structured answers using any notes provided. Be comprehensive.",
)
```

Then the group chat itself, with a round-robin speaker picker and a hard stop after four messages. Your opening prompt counts as one, so that's three agent turns:

```python
from agent_framework.orchestrations import GroupChatBuilder, GroupChatState

def round_robin_selector(state: GroupChatState) -> str:
    """A round-robin selector function that picks the next speaker based on the current round index."""

    participant_names = list(state.participants.keys())
    return participant_names[state.current_round % len(participant_names)]

# Build the group chat workflow
workflow = GroupChatBuilder(
    participants=[researcher, writer],
    termination_condition=lambda conversation: len(conversation) >= 4,
    intermediate_output_from=[researcher, writer],
    selection_func=round_robin_selector,
).build()
```

You run it with `await workflow.run("...")`, the same way as the sequential orchestration in the docs. There's also an `orchestrator_agent=` option where an LLM picks the next speaker, and the docs keep a hard `termination_condition` as a backstop even then. Same lesson again.

Agent Framework also has the safety features AutoGen didn't: `@tool(approval_mode="always_require")` for tools a human has to approve, request/response pauses in workflows, checkpointing, and middleware for logging around agent and tool calls. The downside is that nearly every example in the docs is written for Azure, and the API is bigger than CrewAI's.

## Comparing them side by side

Here's how they line up on control and status, as of 2026-10-05:

| Framework | Who decides what's next | How it stops | Status |
|---|---|---|---|
| BabyAGI (original) | The LLM writes and reorders its own task list | Only when the task list is empty, so in practice when you kill it | Archived; functionz is experimental |
| CrewAI | Your task order, or a manager LLM in hierarchical mode | When the tasks are done; `max_iter` per agent; Flow routers | Active, 1.15.23 |
| AutoGen | Fixed turns, or an LLM picks the next speaker | 11 termination conditions you can combine with OR and AND | Maintenance mode, frozen at 0.7.5 |
| Agent Framework | A workflow graph or a prebuilt orchestration | A termination function, round caps, approvals | Active, 1.0 GA, now 1.20.0 |

And here's how they fit a Gemini project:

| Framework | Memory | Gemini support | Best for |
|---|---|---|---|
| BabyAGI (original) | Vector DB of task results | None built in (OpenAI or Llama) | Learning the pattern |
| CrewAI | Crew memory, Flow state, `@persist` | Native: `LLM(model="gemini/...")` | Shipping a multi-agent pipeline fast |
| AutoGen | Shared conversation thread | OpenAI-compatible endpoint (beta) | Existing AutoGen code only |
| Agent Framework | Sessions and workflow checkpoints | `agent-framework-gemini`, pre-release | Production systems that need approvals and checkpoints |

## Which one would I pick?

**CrewAI, with the crews wrapped in a Flow.** My projects are on Gemini, and CrewAI is the only one of the four where Gemini is a native, stable provider today. The roles-and-tasks model is easy to read, the sequential process has a natural end, and Flows let me keep the important decisions in normal Python code. I'd just set `llm` on every single agent so nothing falls back to OpenAI.

If I needed human approvals, checkpoints and long-term support more than I needed Gemini, I'd go with **Microsoft Agent Framework**. Once its Gemini package leaves pre-release, I'd look at it again.

AutoGen only if you already have AutoGen code, and even then, plan the move. BabyAGI to learn from, not to ship.

## Guardrails every autonomous system needs

Whichever one you pick, the framework doesn't make the system safe. These four things do, and you should add them on day one:

1. **Max iterations or rounds.** A hard cap on how many times the loop can go around. CrewAI has `max_iter` and `max_execution_time` per agent, AutoGen has `MaxMessageTermination`, and Agent Framework has `termination_condition` and, in its Magentic orchestration, `max_round_count`. Even when the model decides it's done, the cap is your backstop.
2. **A budget.** Iterations aren't the same as money. Cap tokens or spend too. AutoGen's `TokenUsageTermination` does this, and CrewAI's `max_rpm` at least limits the rate. BabyAGI's only throttle was a five-second sleep.
3. **Human approval for risky tools.** Anything that sends an email, writes to a database or spends money should wait for a person. Agent Framework has `approval_mode="always_require"` on tools and CrewAI Flows have `@human_feedback`. This is the same idea as the MCP post: the guardrail should be in code, not in a prompt asking the model to behave.
4. **Observability.** In the harness post I listed the **eval framework** as one of the three features that matter most. With several agents talking to each other it matters even more. When something goes wrong, you need to see which agent said what, which tool it called and what it cost. Turn on `verbose` in CrewAI, use middleware in Agent Framework, and log every step so you can replay the run later.

## What's next

Reading framework code is good, but I learn more by building. So in the next article we'll turn the harness from last time into our own small autonomous loop, BabyAGI style. It'll have an objective, a task queue, an execution step, a step that creates new tasks and a step that reorders them. Then we'll add the guardrails BabyAGI never had: `max_iterations`, a token budget, an "is the objective met?" check, and an `input()` approval before each new batch of tasks.

Stay tuned, and Happy Coding ;)
