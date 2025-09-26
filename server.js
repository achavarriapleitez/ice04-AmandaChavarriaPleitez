require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const path = require("path");
const ViteExpress = require("vite-express");

const app = express();
const port = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());

// Serve static login page and any other static assets
app.use(express.static(path.join(__dirname, "client", "public")));

// ===== MongoDB setup =====
const uri = `mongodb+srv://${process.env.USERNM}:${process.env.PASS}@${process.env.HOST}/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let entriesCollection = null;
let usersCollection = null;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("A3");

    entriesCollection = db.collection("myA3Data");
    usersCollection = db.collection("users");

    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB();

// ===== Routes =====

// User login with password
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  try {
    let user = await usersCollection.findOne({ username });

    if (!user) {
      await usersCollection.insertOne({ username, password });
      console.log("✅ New account created:", username);
      return res.json({ success: true, message: "Account created successfully", username });
    }

    if (user.password !== password) {
      console.log("❌ Wrong password for user:", username);
      return res.json({ success: false, error: "Incorrect password" });
    }

    console.log("✅ User logged in:", username);
    res.json({ success: true, message: "Login successful", username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// Get all entries for a specific user
app.get("/entries/:username", async (req, res) => {
  try {
    const entries = await entriesCollection
      .find({ username: req.params.username })
      .toArray();
    res.json(entries);
  } catch (err) {
    console.error("Error fetching entries:", err);
    res.status(500).send("Error fetching entries");
  }
});

// Add new entry
app.post("/submit", async (req, res) => {
  try {
    const newEntry = req.body;

    if (!newEntry.username) {
      return res.status(400).json({ error: "Username is required >:(" });
    }

    newEntry.notes = newEntry.notes || "";

    const moodValues = { Happy: 2, Neutral: 1, Sad: 0 };
    const energyValues = {
      1: 0, 2: 0, 3: 1, 4: 2, 5: 3,
      6: 4, 7: 5, 8: 6, 9: 7, 10: 8
    };
    newEntry.score =
      (moodValues[newEntry.mood] || 0) + (energyValues[newEntry.energy] || 0);

    if (newEntry.mood === "Happy" && newEntry.energy >= 7) newEntry.status = "High Spirits";
    else if (newEntry.mood === "Sad" && newEntry.energy <= 3) newEntry.status = "Low Point";
    else if (newEntry.energy >= 8) newEntry.status = "Energized";
    else if (newEntry.energy <= 3) newEntry.status = "Tired";
    else newEntry.status = "Moderate";

    const result = await entriesCollection.insertOne(newEntry);
    console.log("Inserted entry:", result.insertedId);

    res.json({ _id: result.insertedId, ...newEntry });
  } catch (err) {
    console.error("Error inserting entry:", err);
    res.status(500).send("Error inserting entry");
  }
});

// Update an entry
app.put("/entries/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedEntry = req.body;

    updatedEntry.notes = updatedEntry.notes || "";

    const result = await entriesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedEntry }
    );

    if (result.modifiedCount === 1) res.json({ message: "Updated successfully" });
    else res.status(404).json({ error: "Entry not found" });
  } catch (err) {
    console.error("Error updating entry:", err);
    res.status(500).send("Error updating entry");
  }
});

// Delete entry by ID
app.delete("/entries/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Deleting entry with id:", id);

    const result = await entriesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) res.json({ message: "Entry deleted" });
    else res.status(404).json({ error: "Entry not found" });
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).send("Error deleting entry");
  }
});

// ===== Serve React App =====

// Serve the React build from Vite
app.use(express.static(path.join(__dirname, "client", "dist")));

// Fallback for React routing
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// ===== Start Server =====
ViteExpress.listen(app, port, () => {
  console.log(`🚀 Server + Vite running at http://localhost:${port}`);
});
