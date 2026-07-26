import React, { useEffect, useState } from "react";
import { authorizedFetch } from "./auth";

const STEP_TITLES = ["Дэлгэрэнгүй", "Оролцогчид", "Цаг сонгох", "Баталгаажуулах"];

export default function Scheduler() {
  const [step, setStep] = useState(1);

  const [attendees, setAttendees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState([]);
  const [requiredIds, setRequiredIds] = useState([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [title, setTitle] = useState("Q3 Roadmap Review");
  const [date, setDate] = useState("2026-07-16");
  const [duration, setDuration] = useState(45);
  const [agenda, setAgenda] = useState("");
  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    authorizedFetch("/attendees").then((r) => r.json()).then(setAttendees);
    authorizedFetch("/rooms").then((r) => r.json()).then((data) => {
      setRooms(data);
      setRoomId(data[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!date || selectedAttendeeIds.length === 0) return;
    const params = new URLSearchParams({
      date,
      attendeeIds: selectedAttendeeIds.join(","),
      durationMinutes: String(duration),
    });
    if (roomId) params.set("roomId", roomId);

    authorizedFetch(`/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailability(data);
        setSelectedSlot(null);
      });
  }, [date, selectedAttendeeIds, roomId, duration]);

  function addAttendee(id) {
    setSelectedAttendeeIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setRequiredIds((prev) => (prev.includes(id) ? prev : [...prev, id])); // default to Required
  }
  function removeAttendee(id) {
    setSelectedAttendeeIds((prev) => prev.filter((x) => x !== id));
    setRequiredIds((prev) => prev.filter((x) => x !== id));
  }
  function toggleRequired(id) {
    setRequiredIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    if (!selectedSlot) return;
    setSending(true);
    const res = await authorizedFetch("/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        start: to24h(selectedSlot.start),
        end: to24h(selectedSlot.end),
        attendeeIds: selectedAttendeeIds,
        roomId,
        agenda,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setToast({ type: "error", msg: data.error || "Хурал товлож чадсангүй." });
      return;
    }
    setToast({ type: "ok", msg: `Товлолоо: ${data.title} · ${selectedSlot.start}` });
  }

  const room = rooms.find((r) => r.id === roomId);
  const canContinue =
    (step === 1 && title.trim() && date && isWeekday(date)) ||
    (step === 2 && selectedAttendeeIds.length > 0) ||
    (step === 3 && selectedSlot) ||
    step === 4;

  return (
    <div className="app">
      <StepHeader step={step} onBack={() => setStep((s) => s - 1)} />

      <div className="step-body">
        {step === 1 && (
          <StepDetails
            title={title}
            setTitle={setTitle}
            date={date}
            setDate={setDate}
            duration={duration}
            setDuration={setDuration}
            room={room}
          />
        )}
        {step === 2 && (
          <StepAttendees
            attendees={attendees}
            selectedAttendeeIds={selectedAttendeeIds}
            requiredIds={requiredIds}
            addAttendee={addAttendee}
            removeAttendee={removeAttendee}
            toggleRequired={toggleRequired}
            search={attendeeSearch}
            setSearch={setAttendeeSearch}
          />
        )}
        {step === 3 && (
          <StepTime
            availability={availability}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
          />
        )}
        {step === 4 && (
          <StepConfirm
            title={title}
            date={date}
            slot={selectedSlot}
            room={room}
            attendeeCount={selectedAttendeeIds.length}
            agenda={agenda}
            setAgenda={setAgenda}
          />
        )}
      </div>

      <div className="bottom-actions">
        <button
          className="btn primary pill"
          disabled={!canContinue || sending}
          onClick={() => (step < 4 ? setStep((s) => s + 1) : handleSend())}
        >
          {step < 4 ? "Үргэлжлүүлэх" : sending ? "Илгээж байна…" : "Урилга илгээх"}
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.type === "error" ? "error" : ""}`} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StepHeader({ step, onBack }) {
  return (
    <div className="step-header">
      {step > 1 ? (
        <button className="back-link" onClick={onBack}>‹ Буцах</button>
      ) : (
        <span />
      )}
      <span className="step-progress">{step}/4</span>
      <h1>{STEP_TITLES[step - 1]}</h1>
    </div>
  );
}

function StepDetails({ title, setTitle, date, setDate, duration, setDuration, room }) {
  return (
    <div className="card">
      <div className="field-group">
        <label>Хурлын нэр</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field-group">
        <label>Огноо</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && !isWeekday(date) && (
          <p className="field-error">Зөвхөн Даваа–Баасан гарагт хурал товлох боломжтой.</p>
        )}
      </div>
      <div className="field-group">
        <label>Үргэлжлэх хугацаа</label>
        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          <option value={30}>30 мин</option>
          <option value={45}>45 мин</option>
          <option value={60}>1 цаг</option>
          <option value={90}>1.5 цаг</option>
        </select>
      </div>
      <div className="field-group">
        <label>Өрөө</label>
        <div className="room-fixed">{room?.name ?? "…"}</div>
      </div>
    </div>
  );
}

function StepAttendees({
  attendees,
  selectedAttendeeIds,
  requiredIds,
  addAttendee,
  removeAttendee,
  toggleRequired,
  search,
  setSearch,
}) {
  const selected = attendees.filter((a) => selectedAttendeeIds.includes(a.id));
  const query = search.trim().toLowerCase();
  const results = query
    ? attendees
        .filter((a) => !selectedAttendeeIds.includes(a.id) && a.name.toLowerCase().includes(query))
        .slice(0, 6)
    : [];

  return (
    <div className="card">
      <div className="field-group">
        <label>Ажилтан хайх</label>
        <input
          type="text"
          placeholder="Нэрээр хайх…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((a) => (
            <li key={a.id} onClick={() => { addAttendee(a.id); setSearch(""); }}>
              <div className="avatar">{a.initials}</div>
              <div className="attendee-name">
                {a.name}
                <span className="sub">{a.role}</span>
              </div>
              <span className="add-icon">+</span>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 ? (
        <>
          <div className="divider" />
          <ul className="attendee-list">
            {selected.map((a) => (
              <li key={a.id}>
                <div className="avatar">{a.initials}</div>
                <div className="attendee-name">
                  {a.name}
                  <span className="sub">{a.role}</span>
                </div>
                <button
                  className={`req-toggle ${requiredIds.includes(a.id) ? "on" : ""}`}
                  onClick={() => toggleRequired(a.id)}
                >
                  {requiredIds.includes(a.id) ? "Заавал" : "Сонголт"}
                </button>
                <button className="remove-btn" onClick={() => removeAttendee(a.id)}>✕</button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="denied-sub">Дээрх талбараар ажилтны нэрийг бичиж хайна уу.</p>
      )}
    </div>
  );
}

function StepTime({ availability, selectedSlot, setSelectedSlot }) {
  return (
    <div className="card">
      <div className="suggestion-list">
        {availability?.suggestions.map((s, i) => (
          <div
            key={i}
            className={`suggestion ${s.conflicts === 0 ? "best" : ""} ${
              selectedSlot?.start === s.start ? "selected" : ""
            }`}
            onClick={() => setSelectedSlot(s)}
          >
            <span className="time">{s.start} – {s.end}</span>
            <span className="conf">
              {s.conflicts === 0 ? "Бүх оролцогч чөлөөтэй" : `${s.conflicts} зөрчилтэй`}
            </span>
          </div>
        ))}
        {!availability && <p className="denied-sub">Ачаалж байна…</p>}
      </div>
    </div>
  );
}

function StepConfirm({ title, date, slot, room, attendeeCount, agenda, setAgenda }) {
  return (
    <div className="card">
      <div className="summary-row"><span>Гарчиг</span><strong>{title}</strong></div>
      <div className="summary-row"><span>Огноо</span><strong>{date}</strong></div>
      <div className="summary-row"><span>Цаг</span><strong>{slot ? `${slot.start} – ${slot.end}` : "—"}</strong></div>
      <div className="summary-row"><span>Өрөө</span><strong>{room?.name ?? "—"}</strong></div>
      <div className="summary-row"><span>Оролцогчид</span><strong>{attendeeCount}</strong></div>
      <div className="divider" />
      <div className="field-group">
        <label>Гарчиг / тэмдэглэл</label>
        <textarea rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
      </div>
    </div>
  );
}

function isWeekday(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

function to24h(label) {
  const [time, period] = label.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
