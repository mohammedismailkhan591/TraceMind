import AppShell from "../../components/AppShell";

export default function Settings() {
  return <AppShell><div className="page"><div className="eyebrow">ACCOUNT</div><h1>Settings</h1><p className="subtitle">Keep your account and information under your control.</p>
    <div className="settings-grid">
      <div className="setting-row"><div><strong>Profile</strong><p>Manage your name, email and preferences.</p></div><button className="secondary-btn">Edit</button></div>
      <div className="setting-row"><div><strong>Notifications</strong><p>Choose how TraceMind reminds you about important dates.</p></div><button className="secondary-btn">Manage</button></div>
      <div className="setting-row"><div><strong>AI processing</strong><p>Understand what content is sent for AI processing and why.</p></div><button className="secondary-btn">View</button></div>
      <div className="setting-row"><div><strong>Export your data</strong><p>Download the information stored in your TraceMind account.</p></div><button className="secondary-btn">Export</button></div>
      <div className="setting-row"><div><strong>Delete account</strong><p>Permanently remove your account and stored memories.</p></div><button className="secondary-btn">Delete</button></div>
    </div>
  </div></AppShell>
}
