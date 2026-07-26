import React, { useEffect, useState } from "react";
import { readEntryParams, loadSession, exchangeToken } from "./auth";
import AccessDenied from "./AccessDenied";
import Scheduler from "./Scheduler";

export default function App() {
  const [status, setStatus] = useState("checking"); // checking | ok | denied

  useEffect(() => {
    const cached = loadSession();
    if (cached) {
      setStatus("ok");
      return;
    }

    const { tokenid, devPhone } = readEntryParams();
    if (!tokenid && !devPhone) {
      setStatus("denied");
      return;
    }

    exchangeToken({ tokenid, devPhone }).then((session) => {
      setStatus(session ? "ok" : "denied");
    });
  }, []);

  if (status === "checking") return <div className="auth-loading">Түр хүлээнэ үү…</div>;
  if (status === "denied") return <AccessDenied />;
  return <Scheduler />;
}
