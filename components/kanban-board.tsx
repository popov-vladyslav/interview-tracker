"use dom";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useCallback, useMemo, useState } from "react";

type CompanyStatus = "Wishlist" | "Active" | "Paused" | "Offer" | "Not replied" | "Rejected";

interface KanbanCompany {
  id: number;
  name: string;
  role: string;
  status: CompanyStatus;
  stage: string;
  salary: string;
}

interface Props {
  companies: KanbanCompany[];
  statusColumns: string[];
  statusColors: Record<string, string>;
  onStatusChange: (companyId: number, newStatus: CompanyStatus) => void;
  onCardPress: (companyId: number) => void;
  onCardEdit: (companyId: number) => void;
  dom?: import("expo/dom").DOMProps;
}

export default function KanbanBoard({
  companies,
  statusColumns,
  statusColors,
  onStatusChange,
  onCardPress,
  onCardEdit,
}: Props) {
  const [, setDraggingId] = useState<string | null>(null);

  const columnData = useMemo(() => {
    const grouped: Record<string, KanbanCompany[]> = {};
    for (const col of statusColumns) {
      grouped[col] = [];
    }
    for (const c of companies) {
      if (grouped[c.status]) {
        grouped[c.status].push(c);
      }
    }
    return grouped;
  }, [companies, statusColumns]);

  const handleDragStart = useCallback(
    (result: { draggableId: string }) => {
      setDraggingId(result.draggableId);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setDraggingId(null);
      if (!result.destination) return;
      const sourceStatus = result.source.droppableId;
      const destStatus = result.destination.droppableId;
      if (sourceStatus === destStatus) return;
      const companyId = Number(result.draggableId);
      onStatusChange(companyId, destStatus as CompanyStatus);
    },
    [onStatusChange],
  );

  return (
    <div style={styles.wrapper}>
      <style>{`
        .kanban-card .kanban-edit-btn { opacity: 0; transition: opacity 150ms ease; }
        .kanban-card:hover .kanban-edit-btn { opacity: 1; }
      `}</style>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={styles.board}>
          {statusColumns.map((status) => {
            const cards = columnData[status] || [];
            const color = statusColors[status] || "#64748B";
            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      ...styles.column,
                      ...(snapshot.isDraggingOver
                        ? styles.columnDragOver
                        : undefined),
                    }}
                  >
                    <div style={styles.columnHeader}>
                      <span
                        style={{
                          ...styles.columnDot,
                          backgroundColor: color,
                        }}
                      />
                      <span style={styles.columnTitle}>{status}</span>
                      <span style={styles.columnCount}>{cards.length}</span>
                    </div>

                    <div style={styles.cardList}>
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div style={styles.emptyColumn}>No interviews</div>
                      )}

                      {cards.map((company, index) => (
                        <Draggable
                          key={company.id}
                          draggableId={String(company.id)}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="kanban-card"
                              style={{
                                ...styles.card,
                                ...(dragSnapshot.isDragging
                                  ? styles.cardDragging
                                  : undefined),
                                ...dragProvided.draggableProps.style,
                              }}
                              onClick={() => {
                                if (!dragSnapshot.isDragging) {
                                  onCardPress(company.id);
                                }
                              }}
                            >
                              <div style={styles.cardHeader}>
                                <div style={styles.cardTitle}>
                                  {company.name}
                                </div>
                                <button
                                  className="kanban-edit-btn"
                                  style={styles.editBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCardEdit(company.id);
                                  }}
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                              </div>
                              <div style={styles.cardRole}>{company.role}</div>
                              <div style={styles.cardFooter}>
                                <span style={styles.stageBadge}>
                                  {company.stage}
                                </span>
                                {company.salary && (
                                  <span style={styles.salary}>
                                    {company.salary}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    flex: 1,
    overflow: "hidden",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  board: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    padding: "0 20px 20px",
    overflowX: "auto",
    height: "100%",
  },
  column: {
    minWidth: 270,
    maxWidth: 320,
    flex: "0 0 270px",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    transition: "background-color 150ms ease",
  },
  columnDragOver: {
    backgroundColor: "#EEF2FF",
    outline: "2px dashed #6366F1",
    outlineOffset: -2,
  },
  columnHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    padding: "0 4px",
  },
  columnDot: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1E293B",
  },
  columnCount: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.12)",
    borderRadius: 10,
    padding: "2px 8px",
  },
  cardList: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
    minHeight: 80,
  },
  emptyColumn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    border: "1px dashed #CBD5E1",
    borderRadius: 8,
    color: "#475569",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    cursor: "grab",
    transition: "box-shadow 150ms ease, transform 150ms ease",
    userSelect: "none",
  },
  cardDragging: {
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
    transform: "rotate(2deg)",
    opacity: 0.95,
  },
  cardHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1E293B",
    marginBottom: 2,
    flex: 1,
  },
  editBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "0 2px",
    lineHeight: 1,
    flexShrink: 0,
  },
  cardRole: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stageBadge: {
    fontSize: 12,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    color: "#475569",
  },
  salary: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 500,
  },
};
