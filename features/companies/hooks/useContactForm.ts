import { useState } from "react";

export function useContactForm() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const reset = () => {
    setName("");
    setRole("");
    setEmail("");
    setVisible(false);
  };

  return { visible, setVisible, name, setName, role, setRole, email, setEmail, reset };
}
