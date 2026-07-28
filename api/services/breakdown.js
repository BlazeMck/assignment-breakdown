/**
 * OpenAI assignment breakdown service.
 * Turns raw assignment text + a due date into an ordered list of prioritized tasks.
 */
require("dotenv").config({ path: __dirname + "/../.env" });
const OpenAI = require("openai");

const MODEL = "gpt-4o-mini"; // Note: updated to valid model name if gpt-5-mini isn't deployed

let client;

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
- "time_estimate" is the relative effort the task takes, as an integer: 1 = Low \
(quick), 2 = Medium, 3 = High (most time-consuming/involved). Use 3 for the heaviest \
tasks and 1 for the quickest.
- "status" must always be the string "pending" for newly created tasks.
- "suggested_date" must be a string in YYYY-MM-DD format. Distribute the tasks logically \
between today's date and the assignment's due date. Do not cluster them all on the due date.
- Derive a short "title" (max ~60 chars) summarizing the whole assignment.
- Base everything strictly on the assignment text. Do not invent requirements that are \
not stated or reasonably implied.`;

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
        required: ["description", "priority", "time_estimate", "status", "suggested_date"],
        properties: {
          description: { type: "string" },
          priority: { type: "integer", minimum: 1 },
          time_estimate: {
            type: "integer",
            enum: [1, 2, 3],
            description: "Relative effort: 1 = Low, 2 = Medium, 3 = High.",
          },
          suggested_date: {
            type: "string",
            description: "Recommended completion date in YYYY-MM-DD format.",
          },
          status: { type: "string", enum: ["pending"] },
        },
      },
    },
  },
};

async function breakdownAssignment({ rawText, dueDate }) {
  if (!rawText || !rawText.trim()) {
    throw new Error("rawText is required to break down an assignment.");
  }

  const today = new Date().toISOString().split('T')[0];
  const userContent = [
    `Assignment text:\n${rawText.trim()}`,
    `Due date: ${dueDate || 'not provided'}`,
    `Today's date: ${today}`,
  ].join("\n\n");

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

  const tasks = [...parsed.tasks]
    .sort((a, b) => a.priority - b.priority)
    .map((task, index) => ({ ...task, priority: index + 1 }));

  return { title: parsed.title, tasks };
}

module.exports = { breakdownAssignment, MODEL };