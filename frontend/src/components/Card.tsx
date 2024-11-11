import React from "react";
import { useDrag, useDrop } from "react-dnd";

interface CardProps {
    card: { value: string; suit: string; image: string };
    index: number;
    moveCard: (dragIndex: number, hoverIndex: number) => void;
}

const Card: React.FC<CardProps> = ({ card, index, moveCard }) => {
    const [{ isDragging }, drag] = useDrag({
        type: "CARD",
        item: { index },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: "CARD",
        hover: (draggedItem: { index: number }) => {
            if (draggedItem.index !== index) {
                moveCard(draggedItem.index, index);
            }
        },
    });

    return (
        <div
            ref={(node) => drag(drop(node))}
            style={{ opacity: isDragging ? 0.5 : 1, cursor: "move" }}
        >
            <img src={card.image} alt={`${card.value} of ${card.suit}`} />
        </div>
    );
};

export default Card;