import React from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useState, useEffect, useRef } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import openAI from "./helper"

const Dictaphone = () => {
  const [response, setResponse] = useState("");
  const [voice, setVoice] = useState(null);
  const [password, setPassword] = useState(null);
  const [username, setUsername] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState(true);

  const { data: users, isFetched } = useQuery(["Users"], async () => {
    const request = await fetch("http://localhost:3001/getHistory");
    const response = await request.json();
    return response;
  });

  const navigate = useNavigate();

  if (isFetched) {
    console.log(users);
  }

  useEffect(() => {
    !sessionStorage.getItem("UserID")
      ? navigate("/login")
      : console.log("UserID Acquired");
  }, []);

  const inputRef = useRef();

   let {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if(!voice){
      setVoice(transcript)
    }
  }, [listening])

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const register = async () => {
    const userCheck = users.filter((user) => {
      return user.username === username;
    })[0];
    console.log(userCheck);
    if (!userCheck) {
      try {
        await fetch("http://localhost:3001/postUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            history: [],
            password: password,
          }),
        });
        alert("User registered");
      } catch (error) {
        alert(error);
      }
    } else {
      alert("User already registered");
    }
  };

  const login = () => {
    const findUser = users.filter((user) => {
      return user.username === username;
    });
    if (findUser[0]) {
      if (findUser[0].password === password) {
        alert("logging in");
        sessionStorage.setItem("UserID", findUser[0]._id);
        navigate("/");
        setPassword(null)
        setUsername(null)
      } else {
        alert("invalid password");
      }
    } else {
      alert("User not found");
    }
  };

  const logout = () => {
    sessionStorage.removeItem("UserID");
    navigate("/login");
  };

  const inputCheck = (fnc) => {
    if (password === null) {
      alert("Please enter a valid Password");
    } else if (username === null) {
      alert("Please enter a valid Username");
    } else {
      fnc();
    }
  };

  const createHistory = async (prompt, response) => {
    const d = new Date();
    if (users) {
      const userHistory = users.filter((user) => {
        return user._id === sessionStorage.getItem("UserID");
      })[0].history;
      const temp = [
        ...userHistory,
        {
          prompt: prompt,
          response: response,
          date: `${d.getMonth()}/${d.getDay()}/${d.getFullYear()}`,
        },
      ];
      await fetch("http://localhost:3001/postHistory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: sessionStorage.getItem("UserID"),
          history: temp,
        }),
      });
    }
  };

  const callGPT = async () => {
    const prompt = "";

    const request = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          openAI,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: voice,
          },
        ],
      }),
    });
    const data = await request.json();
    const responseText =
      data.choices && data.choices.length > 0
        ? data.choices[0].message.content
        : "No response from God.";
    setResponse(responseText);
    let audio = new Audio(`http://localhost:3001/speech?text=${responseText}`);
    if (voiceStatus) {
      audio.play();
    }
    inputRef.current.value = "";
    createHistory(voice, responseText);
    console.log(responseText);
  };

  return (
    <>
      <Routes>
        <Route
          path={"/login"}
          element={
            <>
              <div>
                <input
                  placeholder="username"
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                ></input>
              </div>
              <div>
                <input
                  placeholder="password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                ></input>
              </div>
              <div>
                <button
                  onClick={() => {
                    inputCheck(login);
                  }}
                  disabled={username && password ? false : true}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    inputCheck(register);
                  }}
                  disabled={username && password ? false : true}
                >
                  Register
                </button>
              </div>
            </>
          }
        />
        <Route
          path="/"
          element={
            <div>
              <div>
                <p>
                  Welcome,{" "}
                  {users
                    ? users.filter((user) => {
                        return user._id === sessionStorage.getItem("UserID");
                      })[0]?.username
                    : null}
                  .
                </p>
              </div>
              <div>
                <p style={{ color: listening ? "green" : "red" }}>
                  Microphone: {listening ? "on" : "off"}
                </p>
              </div>
              <div>
                <p style={{ color: voiceStatus ? "green" : "red" }}>
                  AI Voice: {voiceStatus ? "On" : "Off"}
                </p>
              </div>
              <div>
                <textarea
                  style={{ height: "230px", width: "500px" }}
                  placeholder="Type here or click record"
                  onChange={(e) => {
                    setVoice(e.target.value);
                  }}
                  ref={inputRef}
                ></textarea>
              </div>
              <div>
                <button
                  onClick={() => {
                    if (voice) {
                      setVoice(null);
                      SpeechRecognition.startListening();
                    } 
                  }}
                >
                  Record
                </button>
                <button
                  onClick={() => {
                    SpeechRecognition.stopListening();
                    setVoice(transcript);
                  }}
                >
                  Stop
                </button>
                <button
                  onClick={() => {
                    resetTranscript();
                    setResponse(null);
                    setVoice(null);
                    inputRef.current.value = null;
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    SpeechRecognition.stopListening();
                    callGPT();
                  }}
                >
                  Ask
                </button>
                <button
                  onClick={() => {
                    voiceStatus ? setVoiceStatus(false) : setVoiceStatus(true);
                  }}
                >
                  Toggle Voice
                </button>
                <button
                  onClick={() => {
                    navigate("/history");
                  }}
                >
                  History
                </button>
                <button onClick={logout}>Logout</button>
              </div>
              <div style={{ backgroundColor: "rgb(191, 186, 186)" }}>
                <p>{voice ? `User: ${voice}` : "No request"}</p>
                <p>{response ? `AI: ${response}` : "No response"}</p>
              </div>
            </div>
          }
        />
        <Route
          path="/history"
          element={
            <>
              <h2>User History</h2>
              <div
                style={{
                  backgroundColor: "rgb(191, 186, 186)",
                }}
              >
                {users && users.length !== 0 ? (
                  users
                    .filter((user) => {
                      return user._id === sessionStorage.getItem("UserID");
                    })[0]
                    ?.history.map((item, key) => {
                      return (
                        <div key={key} style={{ marginBottom: "50px" }}>
                          <p>
                            User:{" "}
                            {users
                              ? users.filter((user) => {
                                  return (
                                    user._id ===
                                    sessionStorage.getItem("UserID")
                                  );
                                })[0]?.username
                              : null}
                          </p>
                          <p>Prompt: {item.prompt}</p>
                          <p>Response: {item.response}</p>
                          <p>Date: {item.date}</p>
                        </div>
                      );
                    })
                ) : (
                  <p>No History Available</p>
                )}
              </div>
            </>
          }
        ></Route>
      </Routes>
    </>
  );
};

export default Dictaphone;
