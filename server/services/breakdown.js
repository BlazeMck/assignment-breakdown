/**
 * OpenAI assignment breakdown service.
 * Turns raw assignment text + a due date into an ordered list of prioritized tasks.
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

const SYSTEM_PROMPT = `You are an academic planning assistant for students. \
Given the raw text of an assignment and its due date, you break the assignment \
down into a clear, ordered list of concrete, actionable tasks a student can \
follow to complete it on time.

Guidelines:
- Produce between 2 and 8 tasks. Prefer fewer, meaningful tasks over many trivial ones.
- Each task description must be a single concrete action (e.g. "Draft the introduction", \
"Find and read 3 peer-reviewed sources"), written in the imperative.
- Order tasks in the sequence they should be done. The "priority" field is a 1-based \
integer where 1 is done first.
- "time_estimate" is the relative effort the task takes, as one of exactly "High", \
"Medium", or "Low". Use "High" for the most time-consuming/involved tasks, "Low" for \
quick ones, and "Medium" in between.
- "status" must always be the string "pending" for newly created tasks.
- Derive a short "title" (max ~60 chars) summarizing the whole assignment.
- Consider the due date when sequencing and estimating, but do not invent dates or \
calendar entries in the output.
- Base everything strictly on the assignment text. Do not invent requirements that are \
not stated or reasonably implied.`;

/**
 * JSON Schema passed to the model via structured outputs so the response is
 * guaranteed to match the shape we persist into the `assignments` / `tasks` tables.
 */
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "tasks"],
  properties: {
    title: {
      type: "string",
      description: "Short summary title for the whole assignment.",
    },
    tasks: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "priority", "time_estimate", "status"],
        properties: {
          description: { type: "string" },
          priority: { type: "integer", minimum: 1 },
          time_estimate: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description: "Relative effort the task takes.",
          },
          status: { type: "string", enum: ["pending"] },
        },
      },
    },
  },
};

/**
 * Break an assignment down into prioritized tasks using OpenAI.
 *
 * @param {{ rawText: string, dueDate?: string }} input
 * @returns {Promise<{ title: string, tasks: Array<{description: string, priority: number, time_estimate: 'High'|'Medium'|'Low', status: string}> }>}
 */
async function breakdownAssignment({ rawText, dueDate }) {
  if (!rawText || !rawText.trim()) {
    throw new Error("rawText is required to break down an assignment.");
  }

  const userContent = [
    `Assignment text:\n${rawText.trim()}`,
    dueDate ? `Due date: ${dueDate}` : "Due date: not provided",
  ].join("\n\n");

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
        name: "assignment_breakdown",
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

  // Normalize priority ordering defensively: sort by the model's priority,
  // then re-number 1..n so the sequence is always contiguous.
  const tasks = [...parsed.tasks]
    .sort((a, b) => a.priority - b.priority)
    .map((task, index) => ({ ...task, priority: index + 1 }));

  return { title: parsed.title, tasks };
}

module.exports = { breakdownAssignment, MODEL };
