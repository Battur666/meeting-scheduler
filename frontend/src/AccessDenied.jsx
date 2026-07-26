import React from "react";

export default function AccessDenied() {
  return (
    <div className="denied-screen">
      <div className="denied-card">
        <p className="eyebrow">Toki Zadgai</p>
        <h1>Хандах эрхгүй байна</h1>
        <p className="denied-sub">
          Энэ апп зөвхөн компанийн идэвхтэй ажилтнуудад зориулагдсан. Хэрэв та ажилтан
          боловч энэ мессежийг харж байгаа бол админтай холбогдоно уу.
        </p>
      </div>
    </div>
  );
}
