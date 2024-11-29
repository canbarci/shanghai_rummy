import React, { useEffect, useState } from "react";
import axios from 'axios';
import { getDatabase, ref, onValue} from "firebase/database"
import "./DiscardPile.css"

interface CardType {
    value: string;
    suit: string;
    image: string;
}

const DiscardPile = () => {
    const playerId = localStorage.getItem('playerId');
    const db = getDatabase();
    const totalRef = ref(db, 'game/discardPile/total');
    const currentPlayerRef = ref(db, `game/currentPlayer`);
    const cardDrawnRef = ref(db, `game/players/${playerId}/cardDrawn`);
    const [discardedCard, setDiscardedCard] = useState<CardType | null>(null);
    const [total, setTotal] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [cardDrawn, setCardDrawn] = useState(false);

    useEffect(() => {
        const totalListener = onValue(totalRef, (snapshot) => {
            const newTotal = snapshot.val();
            setTotal(newTotal);
            
            if (newTotal > 0) {
                getCard(newTotal - 1);
            } else {
                setDiscardedCard(null);
            }
        });

        const currentPlayerListener = onValue(currentPlayerRef, (snapshot) => {
            setCurrentPlayer(snapshot.val());
        });

        const cardDrawnListener = onValue(cardDrawnRef, (snapshot) => {
            setCardDrawn(snapshot.val());
        });

        return () => {
            totalListener();
            currentPlayerListener();
            cardDrawnListener();
        };
    }, []);

    const handleImageClick = async () => {
        if (playerId === currentPlayer && !cardDrawn) {
            await drawCard();
        } else {
            alert(cardDrawn 
                ? "You've already drawn a card this turn." 
                : "It's not your turn to draw a card."
            );
        }
    };

    const getCard = async (index) => {
        try {
            const { data: card } = await axios.get(`http://localhost:3001/api/discard-pile/card/${index}`);
            setDiscardedCard(card);
        } catch (error) {
            console.error("Error getting card:", error);
        }
    };

    const drawCard = async () => {
        try {
            const { data: drawnCardData } = await axios.post(`http://localhost:3001/api/discard-pile/draw`);
            const drawnCard = drawnCardData.drawnCard;

            await axios.post(`http://localhost:3001/api/player-hand/${playerId}/add-card`,
                { drawnCard }
            );
        } catch (error) {
            console.error("Error drawing new card:", error);
        }
    }
    
    return (
        <main>
            <div className="discard-pile">
                {total > 0 && discardedCard ? (
                    <div className="discard-card">
                        <img 
                            src={discardedCard.image} 
                            alt={`${discardedCard.value} of ${discardedCard.suit}`}
                            className="card-image"
                            onClick={handleImageClick}
                            style={{
                                cursor: !cardDrawn ? 'pointer' : 'not-allowed',
                                pointerEvents: !cardDrawn ? 'auto' : 'none'
                            }}
                        />
                    </div>
                ) : (
                    <div className="discard-card empty-discard">
                        <div className="card-placeholder"></div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default DiscardPile;