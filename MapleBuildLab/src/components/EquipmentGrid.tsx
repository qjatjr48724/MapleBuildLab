export default function EquipmentGrid() {
  // Step 1: 모양만. Step 2에서 슬롯 클릭/선택을 붙일 거예요.
  const slots = [
    "CAP",
    "MEDAL",
    "FOREHEAD",
    "RING",
    "RING",
    "MANTLE",
    "CLOTHES",
    "PENDANT",
    "SHIELD",
    "GLOVES",
    "BELT",
    "RING",
    "RING",
    "PANTS",
    "SHOES",
    "WEAPON",
    "PET ACC",
    "PET",
  ];

  return (
    <section className="panel">
      <h2 className="panelTitle">착용 아이템 정보</h2>

      <div className="equipWindow">
        <div className="equipHeader">EQUIPMENT INVENTORY</div>
        <div className="equipGrid">
          {slots.map((s, idx) => (
            <div key={`${s}-${idx}`} className="equipSlot">
              {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
