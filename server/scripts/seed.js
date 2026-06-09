require("dotenv").config();
const supabase = require("../config/database");

/**
 * Seeds the database with test users and assignments
 * This is useful for local development and testing
 */
async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    // Safety check: Prevent accidental seeding on non-local/production databases
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const isRemote = supabaseUrl.includes("supabase.co") || process.env.NODE_ENV === "production";
    const isForced = process.argv.includes("--force");

    if (isRemote && !isForced) {
      throw new Error("Seeding aborted: Target database appears to be a remote environment. Use --force to override.");
    }

    console.log("Cleaning up existing data...");
    await supabase.from("assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Create test users
    const testUsers = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Alice Johnson",
        email: "alice-0000@example.com",
        password: "hashed_password_1",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Bob Smith",
        email: "bob-0001@example.com",
        password: "hashed_password_2",
      },
    ];

    console.log("Inserting test users...");
    const { error: userError } = await supabase
      .from("users")
      .insert(testUsers);

    if (userError && userError.code !== "23505") throw userError;

    console.log("Users inserted successfully or already existed");

    // Create test assignments
    const testAssignments = [
      {
        id: "a550e840-0e29-b41d-4a71-644665544000",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Complete the project documentation and submit for review",
        title: "Documentation Project",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
      {
        id: "b550e840-0e29-b41d-4a71-644665544001",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        raw_text: "Implement REST API endpoints for user management",
        title: "API Implementation",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      },
      {
        id: "c550e840-0e29-b41d-4a71-644665544002",
        user_id: "550e8400-e29b-41d4-a716-446655440001",
        raw_text: "Design database schema for the application",
        title: "Database Design",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      },
    ];

    console.log("Inserting test assignments...");
    const { error: assignmentsError } = await supabase
      .from("assignments")
      .insert(testAssignments);

    if (assignmentsError && assignmentsError.code !== "23505") throw assignmentsError;

    console.log("Assignments inserted successfully or already existed");

    console.log("Database seed completed!");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log("Seed complete. Exiting.");
    process.exit(0);
  });
}

module.exports = seedDatabase;
