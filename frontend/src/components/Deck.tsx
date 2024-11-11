import "../App.css"
import React  from "react";
import axios from 'axios';
import { useEffect, useState } from 'react';

const Deck = () => {
    const [cardsDealt, setCardsDealt] = useState(false);
    // const [hand, setHand] = useState<Card[]>([]);

    interface Card {
        value: string;
        suit: string;
        image: string;
    }

    useEffect(() => {
        const intervalId = setInterval(async () => {
            const { data: cardsDealtData } = await axios.get('http://localhost:3001/api/deck/status');
            if (cardsDealtData === true) {
                setCardsDealt(true);
                
                clearInterval(intervalId);
            }
        }, 1000);
    }, []);

    const handleImageClick = async () => {
        console.log('Image clicked!');

        if (cardsDealt === false) {
            initializeDeck()
        } else {
            // getPlayerHand()
            // drawCard()
        }
    };

    const initializeDeck = async () => {
        try {
            await axios.post('http://localhost:3001/api/deck/init')
        } catch (error) {
            console.error("Error initializing deck:", error);
        }
    };

    // const drawCard = async () => {
    //     try {
    //         const { data: newCard } = await axios.get('http://localhost:3001/api/deck/draw');
    //         updateHand(newCard)
    //     } catch (error) {
    //         console.error("Error fetching new card:", error);
    //     }
    // }

    // const updateHand = async (newCard: any) => {
    //     try {
    //         await axios.post('http://localhost:3001/api/deck/update-hand')
    //     } catch (error) {
    //         console.error("Error updating hand:", error);
    //     }
    // }

    return (
        <main>
            <img className="card" src="https://deckofcardsapi.com/static/img/back.png" alt="Back of Card" onClick={handleImageClick}></img>
        </main>
    );
}

export default Deck;