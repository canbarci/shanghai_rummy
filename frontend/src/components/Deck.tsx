import React from "react";
import { useDeck } from '../contexts/DeckContext.tsx';
import "../App.css";

const Deck: React.FC = () => {
    const { deckState, initializeDeck, drawCard } = useDeck();

    const handleImageClick = async () => {
        console.log('Image clicked!');

        if (!deckState.cardsDealt) {
            await initializeDeck();
        } else {
            const newCard = await drawCard();
            if (newCard) {
                // Handle the drawn card
                console.log('Drew card:', newCard);
            }
        }
    };

    return (
        <main>
            <img 
                className="card" 
                src="https://deckofcardsapi.com/static/img/back.png" 
                alt="Back of Card" 
                onClick={handleImageClick}
            />
        </main>
    );
};

export default Deck;