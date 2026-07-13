/**
 * OpenAI task dependency service.
 *
 * Second step of the agentic breakdown flow: given the task list produced by
 * the breakdown service, ask the model which tasks BLOCK which other tasks
 * (e.g. "you can't build the dashboard until the API exists"). Returns a
 * `depends_on` list of prerequisite task priorities for each task.
 */
const OpenAI = require("openai");

const MODEL = "gpt-5-mini";

let client;

/**
 * Lazily create the OpenAI client so requiring this module doesn't throw
 * when OPENAI_API_KEY is missing (e.g. during tests or local boot).
 */
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in the environment.");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a project planning assistant. You are given a \
list of tasks that were already broken out of a single assignment. Each task \
has a "priority" number (1-based) and a "description". Your only job is to \
determine the dependencies between these tasks — that is, which tasks must be \
finished before another task can begin.

Guidelines:
- For every task in the input, return an object with its "priority" and a \
"depends_on" array listing the priority numbers of the tasks that must be \
completed first (its direct prerequisites).
- Only include DIRECT prerequisites. If task C needs B and B needs A, then C \
depends on [B], not [A, B] — the chain through B already implies A.
- A task with no prerequisites must have an empty "depends_on" array.
- A task may depend on more than one other task (e.g. a task that needs both a \
backend and a design finished first).
- Never make a task depend on itself, and never create circular dependencies.
- Only reference priority numbers that exist in the input. Do not invent tasks.
- Return exactly one entry for every task in the input, no more and no less.`;

/**
 * JSON Schema passed to the model via structured outputs so the response is
 * guaranteed to be a per-task list of prerequisite priorities.
 */
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["dependencies"],
  properties: {
    dependencies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "depends_on"],
        properties: {
          priority: {
            type: "integer",
            minimum: 1,
            description: "The task these prerequisites belong to.",
          },
          depends_on: {
            type: "array",
            description:
              "Priority numbers of tasks that must be completed before this one.",
            items: { type: "integer", minimum: 1 },
          },
        },
      },
    },
  },
};

/**
 * Detect dependencies between already-generated tasks using OpenAI.
 *
 * @param {Array<{ description: string, priority: number }>} tasks
 *   The tasks produced by the breakdown service (only priority + description are used).
 * @returns {Promise<Array<{ priority: number, depends_on: number[] }>>}
 *   One entry per task, listing the priorities it directly depends on.
 */
async function detectDependencies(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error("A non-empty tasks array is required to detect dependencies.");
  }

  // Feed the model just the priority + description of each task.
  const taskList = tasks
    .map((task) => `${task.priority}. ${task.description}`)
    .join("\n");

  const userContent = `Tasks:\n${taskList}`;

  // Note: the gpt-5 family only supports the default temperature (1),
  // so we don't pass a custom temperature here.
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_dependencies",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(raw);

  const validPriorities = new Set(tasks.map((task) => task.priority));

  // Defensively clean the model's output: drop self-references and any
  // priority that isn't a real task, and de-duplicate.
  return parsed.dependencies.map((entry) => ({
    priority: entry.priority,
    depends_on: [...new Set(entry.depends_on)].filter(
      (p) => p !== entry.priority && validPriorities.has(p),
    ),
  }));
}

module.exports = { detectDependencies, MODEL };
