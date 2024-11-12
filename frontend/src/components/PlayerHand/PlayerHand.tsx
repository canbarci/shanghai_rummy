import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Card from '../Card.tsx';
import { usePlayerHand } from '../../contexts/PlayerHandContext.tsx';
import { useDeck } from '../../contexts/DeckContext.tsx';
import './PlayerHand.css';

const PlayerHand: React.FC = () => {
    const { playerState, moveCard } = usePlayerHand();
    const { deckState } = useDeck();
    const { playerName, hand, isLoading } = playerState;

    if (!deckState.cardsDealt) {
        return <div className="waiting">Click deck to deal cards</div>;
    }

    if (isLoading) {
        return <div className="loading">Dealing hand...</div>;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <main>
                <h1 className="player-name">{playerName}</h1>
                <div className="player-hand">
                    {hand.map((card, index) => (
                        <Card
                            key={`${card.suit}-${card.value}-${index}`}
                            card={card}
                            index={index}
                            moveCard={moveCard}
                        />
                    ))}
                </div>
            </main>
        </DndProvider>
    );
};

export default PlayerHand;