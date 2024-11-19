import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Card, DeckState } from '../types/deck.tsx';

interface DeckContextType {
    deckState: DeckState;
    initializeDeck: () => Promise<void>;
    drawCard: (playerId: string) => Promise<void>;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deckState, setDeckState] = useState<DeckState>({
        deckId: null,
        cardsDealt: false,
        remaining: 0
    });

    useEffect(() => {
        const checkCardsDealt = async () => {
            try {
                const { data: cardsDealtData } = await axios.get('http://localhost:3001/api/deck/status');
                setDeckState(prev => ({ ...prev, cardsDealt: cardsDealtData }));
            } catch (error) {
                console.error("Error checking cards dealt status:", error);
            }
        };

        const intervalId = setInterval(checkCardsDealt, 1000);
        clearInterval(intervalId)
        return () => clearInterval(intervalId);
    }, []);

    const initializeDeck = async () => {
        try {
            const response = await axios.post('http://localhost:3001/api/deck/init');
            console.log(response.data.deckData.deck_id)
            setDeckState(prev => ({
                ...prev,
                deckId: response.data.deckData.deck_id,
                cardsDealt: true,
                remaining: response.data.deckData.remaining
            }));
        } catch (error) {
            console.error("Error initializing deck:", error);
        }
    };

    const drawCard = async (playerId: string) => {
        try {
            const response = await axios.post('http://localhost:3001/api/deck/draw', { playerId });
            setDeckState(prev => ({
                ...prev,
                remaining: response.data.deckData.remaining
            }));
        } catch (error) {
            console.error("Error drawing card:", error);
            return null;
        }
    };

    return (
        <DeckContext.Provider value={{
            deckState,
            initializeDeck,
            drawCard(playerId: string)
        }}>
            {children}
        </DeckContext.Provider>
    );
};

export const useDeck = () => {
    const context = useContext(DeckContext);
    if (context === undefined) {
        throw new Error('useDeck must be used within a DeckProvider');
    }
    return context;
};