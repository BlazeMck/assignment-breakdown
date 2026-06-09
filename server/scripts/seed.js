require("dotenv").config();
const supabase = require("../config/database");

/**
 * Seeds the database with test users and assignments
 * This is useful for local development and testing
 */
async function seedDatabase() {
  try {
    console.log("Starting database seed...");

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
    for (const user of testUsers) {
      const { error: singleUserError } = await supabase
        .from("users")
        .insert([user]);

      if (singleUserError && singleUserError.code !== "23505") {
        console.error("Error inserting user:", user.email, singleUserError);
        throw singleUserError;
      }
    }

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
    for (const assignment of testAssignments) {
      const { error: singleAssignmentError } = await supabase
        .from("assignments")
        .insert([assignment]);

      if (singleAssignmentError && singleAssignmentError.code !== "23505") {
        console.error(
          "Error inserting assignment:",
          assignment.id,
          singleAssignmentError,
        );
        throw singleAssignmentError;
      }
    }

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
