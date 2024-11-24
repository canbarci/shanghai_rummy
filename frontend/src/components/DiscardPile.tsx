import "../App.css"
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { getDatabase, ref, onValue} from "firebase/database"
import Card from "./Card/Card.tsx"; // Import Card component

const DiscardPile = () => {
    const db = getDatabase();
    const cardsDealtRef = ref(db, `game/cardsDealt`);
    const discardRef = ref(db, `game/discard`);
    const totalRef = ref(db, 'game/discardPile/total');
    const [discardedCard, setDiscardedCard] = useState<CardType>();
    const [total, setTotal] = useState<CardType>();

    interface CardType {
        value: string;
        suit: string;
        image: string;
    }

    useEffect(() => {
        const totalListener = onValue(totalRef, (snapshot) => {
            const total = snapshot.val();
            if (total && total > 0) {
                getCard(total - 1);
            }
        });

        return () => {
            totalListener();
        };
    }, []);

    const getCard = async (index: number) => {
        try {
            const { data: card } = await axios.get(`http://localhost:3001/api/discard-pile/card/${index}`);
            console.log(card);
            setDiscardedCard(card);
        } catch (error) {
            console.error("Error initializing discard pile:", error);
        }
    };

    // const addCard = async (card: CardType) => {
    //     try {
    //         const { data: card } = await axios.get(`http://localhost:3001/api/discard-pile/card/${index}`);
    //         console.log(card);
    //         setDiscardedCard(card);
    //     } catch (error) {
    //         console.error("Error initializing discard pile:", error);
    //     }
    // };

    return (
        <main>
            <div className="discard-pile">
                {discardedCard && (
                    <div className="discard-card">
                        <img 
                            src={discardedCard.image} 
                            alt={`${discardedCard.value} of ${discardedCard.suit}`}
                            className="card-image"
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

export default DiscardPile;