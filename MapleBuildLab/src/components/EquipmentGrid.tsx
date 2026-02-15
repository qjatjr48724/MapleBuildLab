import React from "react";
import type { EquippedItem } from "./ItemStatPopover";

type Props = {
  equippedBySlot: Record<string, EquippedItem | undefined>;
  getIconUrl: (itemId: number) => string;
};

export default function EquipmentGrid({ equippedBySlot, getIconUrl }: Props) {
  // 슬롯 하나를 “장착 여부에 따라” 렌더링하는 공통 함수
  const renderSlot = (slotKey: string, fallbackLabel: string) => {
    const equipped = equippedBySlot[slotKey];

    const tooltip = equipped
      ? [
          equipped.name,
          `STR ${equipped.stats.STR} / DEX ${equipped.stats.DEX} / INT ${equipped.stats.INT} / LUK ${equipped.stats.LUK}`,
          `물공 ${equipped.stats.WATK} / 마공 ${equipped.stats.MATK}`,
          `명중 ${equipped.stats.ACC} / 회피 ${equipped.stats.AVOID}`,
          `이속 ${equipped.stats.SPEED} / 점프 ${equipped.stats.JUMP}`,
        ].join("\n")
      : fallbackLabel;

    return (
      <div
        className="equipSlot"
        title={tooltip}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {equipped ? (
          <img
            src={getIconUrl(equipped.itemId)}
            alt={equipped.name}
            width={32}
            height={32}
            style={{
              imageRendering: "pixelated",
            }}
          />
        ) : (
          fallbackLabel
        )}
      </div>
    );
  };

  return (
    <section className="panel">
      <h2 className="panelTitle">착용 아이템 정보</h2>

      <div className="equipWindow">
        <div className="equipHeader">EQUIPMENT INVENTORY</div>

        <div className="equipGrid equipGridAreas">
          {/* row1 */}
          <div className="area-cap">
            {renderSlot("cap", "CAP")}
          </div>

          {/* row2 */}
          <div className="area-medal">
            {renderSlot("medal", "MEDAL")}
          </div>
          <div className="area-forehead">
            {renderSlot("forehead", "FOREHEAD")}
          </div>
          <div className="area-ring1">
            {renderSlot("ring1", "RING")}
          </div>
          <div className="area-ring2">
            {renderSlot("ring2", "RING")}
          </div>

          {/* row3 */}
          <div className="area-eye">
            {renderSlot("eye_acc", "EYE ACC")}
          </div>
          <div className="area-ear">
            {renderSlot("ear_acc", "EAR ACC")}
          </div>

          {/* row4 */}
          <div className="area-mantle">
            {renderSlot("mantle", "MANTLE")}
          </div>
          <div className="area-clothes">
            {renderSlot("clothes", "CLOTHES")}
          </div>
          <div className="area-pendant">
            {renderSlot("pendant", "PENDANT")}
          </div>
          <div className="area-weapon">
            {renderSlot("weapon", "WEAPON")}
          </div>
          <div className="area-shield">
            {renderSlot("shield", "SHIELD")}
          </div>

          {/* row5 */}
          <div className="area-gloves">
            {renderSlot("gloves", "GLOVES")}
          </div>
          <div className="area-pants">
            {renderSlot("pants", "PANTS")}
          </div>
          <div className="area-belt">
            {renderSlot("belt", "BELT")}
          </div>
          <div className="area-ring3">
            {renderSlot("ring3", "RING")}
          </div>
          <div className="area-ring4">
            {renderSlot("ring4", "RING")}
          </div>

          {/* row6 */}
          <div className="area-shoes">
            {renderSlot("shoes", "SHOES")}
          </div>

          {/* row7 */}
          <div className="area-taming">
            {renderSlot("taming_mob", "TAMING MOB")}
          </div>
          <div className="area-saddle">
            {renderSlot("saddle", "SADDLE")}
          </div>
          <div className="area-mob">
            {renderSlot("mob_equip", "MOB EQUIP")}
          </div>
          <div className="area-petacc">
            {renderSlot("pet_acc", "PET ACC")}
          </div>
        </div>
      </div>
    </section>
  );
}
