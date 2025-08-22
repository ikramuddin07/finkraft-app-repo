import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    axios.get("http://localhost:5001/api/contacts")
      .then(res => setContacts(res.data));
  }, []);

  const addContact = async (e) => {
    e.preventDefault();
    const res = await axios.post("http://localhost:5001/api/contacts", form);
    setContacts([...contacts, res.data]);
    setForm({ name: "", email: "", phone: "" });
  };

  const deleteContact = async (id) => {
    await axios.delete(`http://localhost:5001/api/contacts/${id}`);
    setContacts(contacts.filter(c => c._id !== id));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>📇 Contact Manager</h1>
      <form onSubmit={addContact}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <button type="submit">Add</button>
      </form>

      <ul>
        {contacts.map(c => (
          <li key={c._id}>
            {c.name} - {c.email} - {c.phone} 
            <button onClick={() => deleteContact(c._id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;