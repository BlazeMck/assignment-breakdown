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
- "time_estimate" is the estimated number of hours the task will take to complete (e.g., 0.5, 1.5, 3, 5).
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
            type: "number",
            description: "Estimated number of hours to complete this task (e.g., 1.5, 2, 4).",
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

  const sortedTasks = [...parsed.tasks].sort((a, b) => a.priority - b.priority);
  const prioritizedTasks = sortedTasks.map((task, index) => ({ ...task, priority: index + 1 }));
  const tasks = staggerTasks(prioritizedTasks);

  return { title: parsed.title, tasks };
}

/**
 * Calculates if the user has enough time to complete the tasks.
 * Returns a status object for the frontend to display.
 */
function calculateTrackStatus(tasks, dueDate, hoursPerDay) {
  // 1. Add up all the estimated hours from the AI
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.time_estimate || 0), 0);

  // 2. Figure out how many days are left until the due date
  const today = new Date();
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(1, Math.ceil((due - today) / msPerDay));

  // 3. Calculate the user's actual available time
  const safeHoursPerDay = hoursPerDay > 0 ? hoursPerDay : 1; // Prevent multiplying by 0
  const userAvailableHours = daysLeft * safeHoursPerDay;

  // 4. Compare them!
  if (userAvailableHours >= totalEstimatedHours) {
    return {
      isOnTrack: true,
      message: `✅ You are on track! This assignment requires ~${totalEstimatedHours} hours. You have ${userAvailableHours} hours available.`,
      totalEstimatedHours,
      userAvailableHours,
      daysLeft
    };
  } else {
    return {
      isOnTrack: false,
      message: `⚠️ Warning: This assignment requires ~${totalEstimatedHours} hours, but with ${daysLeft} day(s) left and ${hoursPerDay} hrs/day, you only have ${userAvailableHours} available hours!`,
      totalEstimatedHours,
      userAvailableHours,
      daysLeft
    };
  }
}

module.exports = { breakdownAssignment, MODEL, calculateTrackStatus };

function staggerTasks(tasks) {
  const scheduledDates = new Set();

  // Sort tasks by priority so the most important task gets to keep its date
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  return sortedTasks.map(task => {
    if (!task.suggested_date) return task; // Skip if no date

    let currentDateStr = task.suggested_date;
    let currentDate = new Date(currentDateStr);

    // If this date is already taken by another task, bump it forward 1 day
    while (scheduledDates.has(currentDateStr)) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDateStr = currentDate.toISOString().split('T')[0];
    }

    // Mark this date as taken
    scheduledDates.add(currentDateStr);

    // Return the task with the new, staggered date
    return { ...task, suggested_date: currentDateStr };
  });
}