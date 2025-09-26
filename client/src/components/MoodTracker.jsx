// src/components/MoodTracker.jsx
import React, { useState, useEffect } from "react";

export default function MoodTracker() {
  // Get username from query params or localStorage
  const params = new URLSearchParams(window.location.search);
  const initialUsername = params.get("username") || localStorage.getItem("username");
  const [username, setUsername] = useState(initialUsername || "");

  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    mood: "",
    energy: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Persist username to localStorage
  useEffect(() => {
    if (username) {
      localStorage.setItem("username", username);
    }
  }, [username]);

  // Redirect if no username
  useEffect(() => {
    if (!username) {
      alert("No username found, please log in first.");
      window.location.href = "/login.html";
    }
  }, [username]);

  // Fetch entries for user
  const loadEntries = async () => {
    if (!username) return;
    try {
      const res = await fetch(`/entries/${username}`);
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [username]);

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.mood || !formData.energy) return;

    const moodValues = { Happy: 2, Neutral: 1, Sad: 0 };
    const energyValues = { 1:0,2:0,3:1,4:2,5:3,6:4,7:5,8:6,9:7,10:8 };
    const score = (moodValues[formData.mood] || 0) + (energyValues[formData.energy] || 0);

    let status = "Moderate";
    if (formData.mood === "Happy" && formData.energy >= 7) status = "High Spirits";
    else if (formData.mood === "Sad" && formData.energy <= 3) status = "Low Point";
    else if (formData.energy >= 8) status = "Energized";
    else if (formData.energy <= 3) status = "Tired";

    const entry = { username, ...formData, score, status };

    try {
      if (editingId) {
        await fetch(`/entries/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
        setEditingId(null);
      } else {
        await fetch("/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      }
      setFormData({ date: "", mood: "", energy: "", notes: "" });
      loadEntries();
    } catch (err) {
      console.error("Error saving entry:", err);
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    try {
      await fetch(`/entries/${id}`, { method: "DELETE" });
      loadEntries();
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  // Edit entry
  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      mood: entry.mood,
      energy: entry.energy,
      notes: entry.notes || "",
    });
    setEditingId(entry._id);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Welcome, {username}!</h1>

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm mb-4">
        <h3 className="mb-3">{editingId ? "Edit Entry" : "Add Entry"}</h3>
        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="date" className="form-label">Date</label>
            <input type="date" id="date" className="form-control" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label htmlFor="mood" className="form-label">Mood</label>
            <select id="mood" className="form-select" value={formData.mood} onChange={handleChange} required>
              <option value="">-- Select --</option>
              <option value="Happy">Happy</option>
              <option value="Neutral">Neutral</option>
              <option value="Sad">Sad</option>
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="energy" className="form-label">Energy (1–10)</label>
            <input type="number" id="energy" className="form-control" min="1" max="10" value={formData.energy} onChange={handleChange} required />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Notes (optional)</label>
          <input type="text" id="notes" className="form-control" placeholder="Your safe space to reflect… 🕯️" value={formData.notes} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary">{editingId ? "Update Entry" : "Save Entry"}</button>
      </form>

      <h3 className="mb-3">Your Entries</h3>
      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Mood</th>
              <th>Energy</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry._id}>
                <td>{entry.date}</td>
                <td>{entry.mood}</td>
                <td>{entry.energy}</td>
                <td>{entry.notes}</td>
                <td>{entry.status}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(entry)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
