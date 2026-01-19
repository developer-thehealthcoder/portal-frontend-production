import { useState, useRef, useEffect } from "react";

export default function KebabMenu({ data }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const handleClick = () => setOpen(!open);

  const handleAction = (action) => {
    setOpen(false);
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={handleClick} className="p-1 cursor-pointer">
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded border z-10">
          <button
            onClick={() => handleAction("Edit")}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => handleAction("Delete")}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
