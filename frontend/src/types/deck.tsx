export interface Card {
    value: string;
    suit: string;
    image: string;
}

export interface DeckState {
    deckId: string | null;
    cardsDealt: boolean;
    remaining: number;
}