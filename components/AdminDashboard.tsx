import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";

type UserReq = {
  id: string;
  fullName?: string;
  email?: string;
  hospital?: string;
  licenseId?: string;
  roleRequested?: string;
  status?: string;
};

const ADMIN_EMAILS = new Set(["leslyndiz6@gmail.com", "l.ndizeye@alustudent.com"]);

export default function AdminDashboard() {
  const [pending, setPending] = useState<UserReq[]>([]);
  const currentEmail = (auth.currentUser?.email ?? "").toLowerCase();

  useEffect(() => {
    if (!ADMIN_EMAILS.has(currentEmail)) return;

    const q = query(
      collection(db, "users"),
      where("roleRequested", "==", "radiologist"),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (snap) => {
      setPending(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [currentEmail]);

        const approveUser = async (uid: string, email: string) => {
        try {
            // Update Firestore
            await updateDoc(doc(db, "users", uid), {
            role: "radiologist",
            status: "approved"
            });

            // Send password setup email
            await sendPasswordResetEmail(auth, email);

            alert("Approved! Password setup email sent.");
        } catch (error) {
            console.error(error);
            alert("Approval failed.");
        }
        };

  const reject = async (uid: string) => {
    const reason = prompt("Reason (optional):") ?? "";
    await updateDoc(doc(db, "users", uid), {
      status: "rejected",
      rejectionReason: reason || null,
      reviewedAt: serverTimestamp(),
      reviewedByEmail: currentEmail,
    });

    await addDoc(collection(db, "auditLogs"), {
      actorEmail: currentEmail,
      action: "REJECT_USER",
      targetUid: uid,
      reason: reason || null,
      createdAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (!ADMIN_EMAILS.has(currentEmail)) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Not authorized</h2>
        <p>This account is not an admin.</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2>Admin Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <h3 style={{ marginTop: 16 }}>Pending Radiologist Requests</h3>
      {pending.length === 0 ? <p>No pending requests.</p> : null}

      {pending.map((u) => (
        <div key={u.id} style={{ border: "1px solid #ccc", padding: 12, marginTop: 10 }}>
          <div><b>{u.fullName}</b> — {u.email}</div>
          <div>Hospital: {u.hospital}</div>
          <div>License ID: {u.licenseId}</div>

          <div style={{ marginTop: 10 }}>
            <button onClick={() => approveUser(u.id, u.email || "")}>Approve</button>
            <button onClick={() => reject(u.id)} style={{ marginLeft: 8 }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}