import { useState } from "react";

export function useStageForm() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const reset = () => {
    setName("");
    setVisible(false);
  };

  return { visible, setVisible, name, setName, adding, setAdding, reset };
}
