import "../App.css"
import React  from "react";
import axios from 'axios';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue } from "firebase/database"

const Deck = () => {
    const db = getDatabase();
    const cardsDeltRef = ref(db, `game/cardsDelt`);
    const deckRef = ref(db, `game/deck`);
    const handRef = ref(db, `players/${getAuth().currentUser?.uid}/hand`);
    const remainingRef = ref(db, `game/deck/remaining`);
    const [cardsDelt, setCardsDelt] = useState(false);
    // const [hand, setHand] = useState<Card[]>([]);

    interface Card {
        value: string;
        suit: string;
        image: string;
    }

    useEffect(() => {
        onValue(cardsDeltRef, (snapshot) => {
            setCardsDelt(snapshot.val());
        })
    }, []);

    const handleImageClick = async () => {
        console.log('Image clicked!');

        if (cardsDelt === false) {
            getDeck()
        } else {
            // getPlayerHand()
            drawCard()
        }
    };

    const getDeck = () => {
        axios.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2&jokers_enabled=true')
            .then(response => {
                const deckData = response.data;
                set(deckRef, deckData);
                set(cardsDeltRef, true)
            })
            .catch(error => {
                console.error(error);
            });
    }

    const drawCard = () => {
        get(deckRef)
            .then((snapshot) => {
                const deckData = snapshot.val();  // get the deck data from Firebase

                if (deckData) {
                    console.log(deckData.deck_id);

                    axios.get(`https://deckofcardsapi.com/api/deck/${deckData.deck_id}/draw/?count=1`)
                        .then(response => {
                            const newCard = response.data.cards[0];
                            const remaining = response.data.remaining

                            updateHand(newCard);
                            set(remainingRef, remaining);

                            console.log(response.data);
                        })
                        .catch(error => {
                            console.error(error);
                        });
                } else {
                    console.log("Deck not initialized yet.");
                }
            })
            .catch((error) => {
                console.error("Failed to retrieve deck from database", error);
            });
    }

    const updateHand = (newCard: any) => {
        get(handRef)
            .then((snapshot) => {
                const hand = snapshot.val()

                const newHand = [...hand, newCard];

                set(handRef, newHand);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    return (
        <main>
            <img className="card" src="https://deckofcardsapi.com/static/img/back.png" alt="Back of Card" onClick={handleImageClick}></img>
        </main>
    );
}

export default Deck;