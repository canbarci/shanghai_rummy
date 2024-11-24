import React from "react";
import { useDrag, useDrop } from "react-dnd";
import "./Card.css";

interface CardProps {
    card: { value: string; suit: string; image: string };
    index: number;
    moveCard: (dragIndex: number, hoverIndex: number) => void;
    isActive: boolean; // Determines if this card is "active"
    onClick: () => void; // Callback for toggling active state
    onDiscard?: () => void; // Callback for discarding the card
}

const Card: React.FC<CardProps> = ({ card, index, moveCard, isActive, onClick, onDiscard }) => {
    const [{ isDragging }, drag, preview] = useDrag({
        type: "CARD",
        item: { index },
        end: (draggedItem, monitor) => {
            const didDrop = monitor.didDrop();
            if (!didDrop && draggedItem) {
                moveCard(draggedItem.index, index);
            }
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [{ isOver }, drop] = useDrop({
        accept: "CARD",
        hover: (draggedItem: { index: number }) => {
            // No-op for hover to prevent jittering
        },
        drop: (draggedItem: { index: number }) => {
            if (draggedItem.index !== index) {
                moveCard(draggedItem.index, index);
                return { moved: true };
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
        }),
    });

    return (
        <div
            ref={(node) => drag(drop(node))}
            onClick={onClick}
            className={`card ${isDragging ? "dragging" : ""} ${isOver ? "over" : ""}`}
        >
            <img
                src={card.image}
                alt={`${card.value} of ${card.suit}`}
                className="card-image"
            />

            {isActive && (
                <div className="card-overlay">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onDiscard) onDiscard();
                        }}
                        className="discard-button"
                    >
                        Discard
                    </button>
                </div>
            )}
        </div>
    );
};

export default Card;