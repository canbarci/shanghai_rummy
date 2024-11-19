import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useDeck } from './DeckContext.tsx';
import { Card, PlayerState } from '../types/playerHand.tsx';

interface PlayerHandContextType {
    playerState: PlayerState;
    moveCard: (dragIndex: number, hoverIndex: number) => Promise<void>;
    refreshHand: () => Promise<void>;
}

const PlayerHandContext = createContext<PlayerHandContextType | undefined>(undefined);

export const PlayerHandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { deckState } = useDeck();
    const [playerState, setPlayerState] = useState<PlayerState>({
        playerId: localStorage.getItem('playerId'),
        playerName: null,
        hand: []
    });

    // Only fetch player data when deck is ready
    useEffect(() => {
        const initializePlayer = async () => {
            if (deckState.cardsDealt && deckState.deckId && playerState.playerId) {
                await Promise.all([
                    getPlayerName(),
                    getPlayerHand(deckState.deckId)
                ]);
            }
        };

        initializePlayer();
    }, [deckState.cardsDealt, deckState.deckId]);

    const getPlayerName = async () => {
        if (!playerState.playerId) return;
        
        try {
            const response = await axios.get(`http://localhost:3001/api/player-hand/name/${playerState.playerId}`);
            setPlayerState(prev => ({
                ...prev,
                playerName: response.data.name
            }));
        } catch (error) {
            console.error("Error fetching player name:", error);
        }
    };

    const getPlayerHand = async (deckId: string) => {
        if (!playerState.playerId) return;
        
        try {
            const { data } = await axios.post(`http://localhost:3001/api/player-hand/hand`, {
                playerId: playerState.playerId,   
                deckId: deckId
            });
            setPlayerState(prev => ({
                ...prev,
                hand: data.hand
            }));
        } catch (error) {
            console.error("Error fetching player hand:", error);
        }
    };

    const moveCard = async (dragIndex: number, hoverIndex: number) => {
        const newHand = [...playerState.hand];
        const draggedCard = newHand[dragIndex];

        newHand.splice(dragIndex, 1);
        newHand.splice(hoverIndex, 0, draggedCard);

        // Optimistic update
        setPlayerState(prev => ({ ...prev, hand: newHand }));

        try {
            await axios.post(`http://localhost:3001/api/player-hand/update`, {
                playerId: playerState.playerId,   
                newHand: newHand
            });
        } catch (error) {
            console.error("Error updating hand order:", error);
            // Rollback on error
            setPlayerState(prev => ({ ...prev, hand: playerState.hand }));
        }
    };

    const refreshHand = async () => {
        if (deckState.deckId) {
            await getPlayerHand(deckState.deckId);
        }
    };

    return (
        <PlayerHandContext.Provider value={{
            playerState,
            moveCard,
            refreshHand
        }}>
            {children}
        </PlayerHandContext.Provider>
    );
};

export const usePlayerHand = () => {
    const context = useContext(PlayerHandContext);
    if (context === undefined) {
        throw new Error('usePlayerHand must be used within a PlayerHandProvider');
    }
    return context;
};