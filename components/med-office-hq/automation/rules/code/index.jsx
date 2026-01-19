// components/RuleEditor.tsx
"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { useTheme } from "next-themes";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";

export default function CodePage({ id }) {
  const [code, setCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "light";

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const { data } = await axiosInstance.get(`/rules/code/${id}`);
        setCode(data.code);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCode();
    // // axios.get(`/api/rules/${id}`).then((res) => {
    // setCode(
    //   'def apply_rule(data):\n    """Example rule that prints hello and returns the input."""\n    print("Hello from rule")\n    return data'
    // );
    // setLoading(false);
    // // });
  }, [id]);

  const handleSave = async () => {
    await axios.post(`/api/rules/${id}`, { code });
    setIsEditing(false);
    alert("Rule saved!");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Rule: {id}</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Editor
          height="450px"
          defaultLanguage="python"
          value={code}
          onChange={(value) => setCode(value || "")}
          options={{
            readOnly: !isEditing,
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 10 },
            scrollBeyondLastLine: false,
          }}
          className="border-1 border-gray-300"
          theme={currentTheme === "dark" ? "vs-dark" : "vs"}
        />
      )}

      {/* <div className="mt-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer"
          >
            Edit
          </button>
        )}
      </div> */}
    </div>
  );
}
