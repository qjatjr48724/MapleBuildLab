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

    // 스샷처럼 "정해진 위치"에 슬롯을 배치할 거라서, map 반복 대신
  // 각 슬롯을 고정된 grid-area로 렌더링합니다.
  return (
    <section className="panel">
      <h2 className="panelTitle">착용 아이템 정보</h2>

      <div className="equipWindow">
        <div className="equipHeader">EQUIPMENT INVENTORY</div>

        <div className="equipGrid equipGridAreas">
          {/* row1 */}
          <div className="equipSlot area-cap">CAP</div>

          {/* row2 */}
          <div className="equipSlot area-medal">MEDAL</div>
          <div className="equipSlot area-forehead">FOREHEAD</div>
          <div className="equipSlot area-ring1">RING</div>
          <div className="equipSlot area-ring2">RING</div>

          {/* row3 */}
          <div className="equipSlot area-eye">EYE ACC</div>
          <div className="equipSlot area-ear">EAR ACC</div>

          {/* row4 */}
          <div className="equipSlot area-mantle">MANTLE</div>
          <div className="equipSlot area-clothes">CLOTHES</div>
          <div className="equipSlot area-pendant">PENDANT</div>
          <div className="equipSlot area-weapon">WEAPON</div>
          <div className="equipSlot area-shield">SHIELD</div>

          {/* row5 */}
          <div className="equipSlot area-gloves">GLOVES</div>
          <div className="equipSlot area-pants">PANTS</div>
          <div className="equipSlot area-belt">BELT</div>
          <div className="equipSlot area-ring3">RING</div>
          <div className="equipSlot area-ring4">RING</div>

          {/* row6 */}
          <div className="equipSlot area-shoes">SHOES</div>

          {/* row7 */}
          <div className="equipSlot area-taming">TAMING MOB</div>
          <div className="equipSlot area-saddle">SADDLE</div>
          <div className="equipSlot area-mob">MOB EQUIP</div>
          <div className="equipSlot area-petacc">PET ACC</div>
        </div>
      </div>
    </section>
  );

}
