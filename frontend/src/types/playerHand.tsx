export interface Card {
    value: string;
    suit: string;
    image: string;
}

export interface PlayerState {
    playerId: string | null;
    playerName: string | null;
    hand: Card[];
    isLoading: boolean;
}