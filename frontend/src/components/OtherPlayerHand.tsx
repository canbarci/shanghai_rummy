import React from 'react';

interface OtherPlayerHandProps {
    cardsCount: number;
}

const OtherPlayerHand: React.FC<OtherPlayerHandProps> = ({ cardsCount }) => {
    return (
        <div className="other-player-hand">
            {Array.from({ length: cardsCount }).map((_, index) => (
                <img
                    key={index}
                    src="https://www.deckofcardsapi.com/static/img/back.png"
                    alt="Card back"
                />
            ))}
        </div>
    );
};

export default OtherPlayerHand;