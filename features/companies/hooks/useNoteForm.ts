import { useState } from "react";

export function useNoteForm() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState("");

  const reset = () => {
    setContent("");
    setVisible(false);
  };

  return { visible, setVisible, content, setContent, reset };
}
