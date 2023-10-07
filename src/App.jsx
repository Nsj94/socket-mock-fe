import React, { useEffect, useState } from "react";
import { socket } from "./socket";

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [typingUserName, setTypingUserName] = useState("");

  const [user, setUser] = useState({
    name: "",
    room: "",
    isSubmitted: false,
  });

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    let typingTimer;

    socket.on("typing", (data) => {
      setTypingUserName(data);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setTypingUserName("");
      }, 500);
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const enterRoom = (e) => {
    e.preventDefault();

    setUser({
      ...user,
      isSubmitted: true,
    });

    socket.emit("join_room", user);
  };

  return (
    <div className="App">
      <ConnectionState isConnected={isConnected} />
      <ConnectionManager />
      {!user.isSubmitted && (
        <form onSubmit={enterRoom}>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            placeholder="Enter Username"
            required
          />
          <input
            type="text"
            value={user.room}
            onChange={(e) => setUser({ ...user, room: e.target.value })}
            placeholder="Enter Room Name"
            required
          />
          <button type="submit">Join Room</button>
        </form>
      )}

      {user.isSubmitted && (
        <>
          <button
            onClick={() => {
              socket.disconnect();
            }}
          >
            Leave Room
          </button>
          <MyForm />
          {typingUserName.length > 0 && <p>{typingUserName}</p>}
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ConnectionState({ isConnected }) {
  return <p>Is Connected : {"" + isConnected}</p>;
}

export function ConnectionManager() {
  function connect() {
    socket.connect();
  }

  function disconnect() {
    socket.disconnect();
  }

  return (
    <>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </>
  );
}

export function MyForm() {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function onSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    socket.emit("message", value);
    setIsLoading(false);
    setValue("");
  }

  return (
    <form onSubmit={onSubmit}>
      <input
        value={value}
        onChange={(e) => {
          socket.emit("typing");
          setValue(e.target.value);
        }}
      />

      <button type="submit" disabled={isLoading}>
        Submit
      </button>
    </form>
  );
}
