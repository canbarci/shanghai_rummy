import React from "react";
import { useDrag, useDrop } from "react-dnd";
import "./Card.css";

interface CardProps {
    card: {
        value: string;
        suit: string;
        image: string;
    };
    index: number;
    moveCard: (dragIndex: number, hoverIndex: number) => void;
    onClick: () => void;
    onDiscard: () => void;
    isDiscardPile?: boolean;
    isActive?: boolean;
}

const Card: React.FC<CardProps> = ({ card, index, moveCard, onClick, onDiscard, isActive, isDiscardPile }) => {
    const playerId = localStorage.getItem('playerId') ?? '';

    const [{ isDragging }, drag] = useDrag({
        type: "CARD",
        item: { 
            index,
            sourcePlayerId: playerId
        },
        canDrag: !isDiscardPile,
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