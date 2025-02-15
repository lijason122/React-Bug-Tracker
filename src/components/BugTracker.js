import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { db, increment, decrement } from "../firebase";
import { Link } from "react-router-dom";
import BugTable from "./BugTable";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationProvider";

const BugTracker = () => {
  const [newBugDescription, setNewBugDescription] = useState("");
  const [newBugPriority, setNewBugPriority] = useState("Medium");
  const [bugList, setBugList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [userList, setUserList] = useState([]);
  const [newUser, setNewUser] = useState("");
  const dispatch = useNotification();

  useEffect(() => {
    db.collection("bugs")
      .orderBy("order", "asc")
      .get()
      .then((querySnapshot) => {
        let arr = [];
        querySnapshot.docs.map((doc) =>
          arr.push({ ...doc.data(), key: doc.id })
        );
        setBugList(arr);
        setLoading(false);
      });
  }, [loading]);

  useEffect(() => {
    db.collection("users")
      .orderBy("name", "asc")
      .get()
      .then((querySnapshot) => {
        let arr = [];
        querySnapshot.docs.map((doc) =>
          arr.push({ ...doc.data(), key: doc.id })
        );
        setUserList(arr);
      });
  }, []);

  const addBug = (event) => {
    event.preventDefault();
    const [assignedUser] = userList.filter((user) => user.name === newUser);
    const newBug = {
      description: newBugDescription,
      priority: newBugPriority,
      createBy: currentUser.displayName,
      createById: currentUser.uid,
      assignedTo: newUser,
      assignedToId: assignedUser.key,
      order:
        newBugPriority === "High" ? 1 : newBugPriority === "Medium" ? 2 : 3,
    };

    setNewBugDescription("");
    setNewBugPriority("Medium");

    db.collection("users")
      .doc(assignedUser.key)
      .update({ bugCount: increment });
    db.collection("bugs").add(newBug);
    setLoading(true);
  };

  const deleteBug = async (id, userId) => {
    db.collection("users").doc(userId).update({ bugCount: decrement });
    await db.collection("bugs").doc(id).delete();
    setLoading(true);
  };

  const handleNotification = (response, msg, e) => {
    if (e) {
      e.preventDefault();
    }
    dispatch({
      type: response,
      message: msg,
    });
  };

  const handleSubmitMessages = (e) => {
    if (newBugDescription && newUser) {
      handleNotification("SUCCESS", "Bug Submitted!");
    } else {
      handleNotification("ERROR", "Error occurred", e);
    }
  };

  return (
    <div>
      <h1>Bug Tracker 🐛</h1>
      <BugTable
        bugs={bugList}
        users={userList}
        onDeleteBug={(id, userId) => deleteBug(id, userId)}
        onClickAlert={() => handleNotification("SUCCESS", "Bug Resolved!")}
      />
      <form onSubmit={addBug}>
        <Form.Group id="newBugDescription">
          <Form.Label>New bug description:</Form.Label>
          <Form.Control
            type="text"
            required
            value={newBugDescription}
            onChange={(event) => setNewBugDescription(event.target.value)}
          />
        </Form.Group>
        <Form.Group id="newBugPriority" className="mt-3">
          <Form.Label>New bug priority:</Form.Label>
          <Form.Select
            type="text"
            required
            value={newBugPriority}
            onChange={(event) => setNewBugPriority(event.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Form.Select>
        </Form.Group>
        <Form.Group id="newUser" className="mt-3">
          <Form.Label>Assign to:</Form.Label>
          <Form.Select
            type="text"
            required
            value={newUser}
            onChange={(event) => setNewUser(event.target.value)}
          >
            <option value={""}>Select User</option>
            {userList.map((user) => {
              return (
                <option key={user.key} value={user.name}>
                  {user.name}
                </option>
              );
            })}
          </Form.Select>
        </Form.Group>
        <Button
          className="w-100 mt-3 btn-warning"
          type="submit"
          onClick={handleSubmitMessages}
        >
          Add New Bug
        </Button>
      </form>
      <div className="w-100 text-center mt-4">
        <Link to="/" className="link">
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default BugTracker;
