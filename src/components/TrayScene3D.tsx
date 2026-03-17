import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TrayItem3D {
  id: string;
  name: string;
  image_url?: string | null;
  quantity: number;
}

interface ItemPosition {
  x: number;
  y: number;
}

interface TrayScene3DProps {
  items: TrayItem3D[];
  traySize: 'small' | 'medium' | 'large';
  onRemoveItem?: (id: string) => void;
  customPositions?: Record<string, ItemPosition>;
  onPositionChange?: (id: string, instanceIndex: number, pos: ItemPosition) => void;
  readOnly?: boolean;
}

function useAutoPositions(items: TrayItem3D[], trayRadius: number) {
  return useMemo(() => {
    const positions: { item: TrayItem3D; x: number; y: number; rotation: number; instanceIndex: number }[] = [];
    const goldenAngle = 137.508 * (Math.PI / 180);
    let idx = 0;

    items.forEach((item) => {
      const count = Math.min(item.quantity, 4);
      for (let i = 0; i < count; i++) {
        const angle = idx * goldenAngle;
        const r = idx === 0 ? 0 : Math.min(25 + Math.sqrt(idx) * 28, trayRadius - 35);
        positions.push({
          item,
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          rotation: (idx * 37) % 360,
          instanceIndex: i,
        });
        idx++;
      }
    });

    return positions;
  }, [items, trayRadius]);
}

function posKey(itemId: string, instanceIndex: number) {
  return `${itemId}__${instanceIndex}`;
}

export default function TrayScene3D({ items, traySize, onRemoveItem, customPositions, onPositionChange, readOnly = false }: TrayScene3DProps) {
  const trayDiameter = traySize === 'small' ? 280 : traySize === 'medium' ? 340 : 400;
  const trayRadius = trayDiameter / 2;
  const itemSize = traySize === 'small' ? 70 : traySize === 'medium' ? 75 : 80;
  const autoPositions = useAutoPositions(items, trayRadius);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Dragging state
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<ItemPosition>({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState<ItemPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; moved: boolean }>({ startX: 0, startY: 0, moved: false });

  // Track new items for bounce animation
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
  const [glowKeys, setGlowKeys] = useState<Set<string>>(new Set());
  const prevKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentKeys = new Set(autoPositions.map(p => posKey(p.item.id, p.instanceIndex)));
    const justAdded = new Set<string>();
    currentKeys.forEach(k => {
      if (!prevKeysRef.current.has(k)) justAdded.add(k);
    });
    prevKeysRef.current = currentKeys;
    if (justAdded.size > 0) {
      setNewKeys(justAdded);
      setGlowKeys(justAdded);
      const timeout = setTimeout(() => setNewKeys(new Set()), 500);
      const glowTimeout = setTimeout(() => setGlowKeys(new Set()), 900);
      return () => { clearTimeout(timeout); clearTimeout(glowTimeout); };
    }
  }, [autoPositions]);

  const getItemPos = useCallback((itemId: string, instanceIndex: number, autoX: number, autoY: number): ItemPosition => {
    const key = posKey(itemId, instanceIndex);
    if (draggingKey === key) return dragPos;
    if (customPositions?.[key]) return customPositions[key];
    return { x: autoX, y: autoY };
  }, [customPositions, draggingKey, dragPos]);

  const handlePointerDown = useCallback((e: React.PointerEvent, key: string, currentX: number, currentY: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Account for the 3D tilt: the visual center of the tray
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setDragOffset({ x: e.clientX - centerX - currentX, y: e.clientY - centerY - currentY });
    setDragPos({ x: currentX, y: currentY });
    setDraggingKey(key);
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, moved: false };
  }, [readOnly]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingKey) return;
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let newX = e.clientX - centerX - dragOffset.x;
    let newY = e.clientY - centerY - dragOffset.y;

    // Clamp to tray radius
    const maxR = trayRadius - itemSize / 2 - 10;
    const dist = Math.sqrt(newX * newX + newY * newY);
    if (dist > maxR) {
      newX = (newX / dist) * maxR;
      newY = (newY / dist) * maxR;
    }

    setDragPos({ x: newX, y: newY });

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragStartRef.current.moved = true;
    }
  }, [draggingKey, dragOffset, trayRadius, itemSize]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingKey) return;
    e.preventDefault();

    if (dragStartRef.current.moved && onPositionChange) {
      const [itemId, instStr] = draggingKey.split('__');
      onPositionChange(itemId, parseInt(instStr), dragPos);
    }

    setDraggingKey(null);
  }, [draggingKey, dragPos, onPositionChange]);

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center rounded-2xl overflow-hidden border-2 border-primary/10"
      style={{
        height: '400px',
        background: 'linear-gradient(180deg, #FDF8F0 0%, #F5EDE0 50%, #EDE4D3 100%)',
        perspective: '800px',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        style={{
          width: trayDiameter,
          height: trayDiameter,
          position: 'relative',
          transform: 'rotateX(20deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Tray base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 35%, #E8D4A8 0%, #C9A96E 40%, #A8853C 80%, #8B6914 100%)',
            boxShadow: `inset 0 2px 20px rgba(255,255,255,0.4), inset 0 -4px 15px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)`,
          }}
        >
          <div style={{ position: 'absolute', inset: '8px', borderRadius: '50%', border: '2px solid rgba(218,185,120,0.6)' }} />
          <div style={{ position: 'absolute', inset: '14px', borderRadius: '50%', background: 'radial-gradient(ellipse at 45% 40%, #D4B77A 0%, #C9A96E 50%, #BF9B5E 100%)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.08)' }} />
        </div>

        {/* Products on tray */}
        {autoPositions.map((pos, i) => {
          const key = posKey(pos.item.id, pos.instanceIndex);
          const currentPos = getItemPos(pos.item.id, pos.instanceIndex, pos.x, pos.y);
          const isHovered = hoveredKey === key;
          const isDragging = draggingKey === key;
          const isNew = newKeys.has(key);
          const isGlowing = glowKeys.has(key);

          return (
            <div
              key={key}
              onPointerDown={(e) => handlePointerDown(e, key, currentPos.x, currentPos.y)}
              onMouseEnter={() => !draggingKey && setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: itemSize,
                height: itemSize,
                transform: `translate(calc(-50% + ${currentPos.x}px), calc(-50% + ${currentPos.y}px)) rotate(${pos.rotation}deg) scale(${isDragging ? 1.2 : isHovered ? 1.1 : 1})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                cursor: readOnly ? 'default' : isDragging ? 'grabbing' : 'grab',
                zIndex: isDragging ? 50 : isHovered ? 10 : 1,
                userSelect: 'none',
                animation: isNew ? 'tray-item-land 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              }}
            >
              {/* Remove button on hover */}
              {!readOnly && isHovered && !isDragging && onRemoveItem && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveItem(pos.item.id); }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    zIndex: 20,
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'hsl(var(--destructive))',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  <X size={12} />
                </button>
              )}

              {/* Product image */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: isDragging
                    ? '0 8px 25px rgba(0,0,0,0.4)'
                    : isHovered
                      ? '0 6px 20px rgba(0,0,0,0.35)'
                      : '0 3px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.15)',
                  border: '2px solid rgba(201,169,110,0.4)',
                  pointerEvents: 'none',
                  animation: isGlowing ? 'tray-item-glow 0.7s ease-out forwards' : 'none',
                }}
              >
                {pos.item.image_url ? (
                  <img
                    src={pos.item.image_url}
                    alt={pos.item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="eager"
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #E8D5B7, #D4BC94)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#8B7355', textAlign: 'center', padding: '4px' }}>
                    {pos.item.name}
                  </div>
                )}
              </div>

              {/* Quantity badge — shown on first instance */}
              {pos.item.quantity > 1 && pos.instanceIndex === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#D32F2F',
                    color: 'white',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transform: `rotate(-${pos.rotation}deg)`,
                    pointerEvents: 'none',
                  }}
                >
                  {pos.item.quantity}
                </div>
              )}

              {/* Hidden quantity indicator — shown only on last visible instance when quantity > 4 */}
              {pos.item.quantity > 4 && pos.instanceIndex === 3 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: `translateX(-50%) rotate(-${pos.rotation}deg)`,
                    background: 'rgba(0,0,0,0.65)',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                  title={`${pos.item.quantity} יחידות — מוצגות 4 בלבד`}
                >
                  +{pos.item.quantity - 4}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A8853C', fontSize: '13px', fontWeight: 500, textAlign: 'center', gap: '8px', animation: 'tray-empty-pulse 2.5s ease-in-out infinite' }}>
            <span style={{ fontSize: '28px' }}>🍽️</span>
            <span>בחר מוצרים<br />מהרשימה למטה</span>
          </div>
        )}
      </div>
    </div>
  );
}
