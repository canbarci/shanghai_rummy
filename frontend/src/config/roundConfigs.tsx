// src/config/gameConfigs.ts
export interface GroupConfig {
    type: 'book' | 'run';
    minCards: number;
    maxGroups: number;
}

export const RoundConfigs = {
    one: [
        { type: 'book', minCards: 3, maxGroups: 2 }
    ],
    two: [
        { type: 'book', minCards: 3, maxGroups: 1 },
        { type: 'run', minCards: 4, maxGroups: 1 }
    ],
    three: [
        { type: 'run', minCards: 4, maxGroups: 2 }
    ],
    four: [
        { type: 'book', minCards: 3, maxGroups: 3 }
    ],
    five: [
        { type: 'book', minCards: 3, maxGroups: 2 },
        { type: 'run', minCards: 4, maxGroups: 1 }
    ],
    six: [
        { type: 'book', minCards: 3, maxGroups: 1 },
        { type: 'run', minCards: 4, maxGroups: 2 }
    ],
    seven: [
        { type: 'run', minCards: 4, maxGroups: 3 }
    ]
};

export const DefaultGameConfig = RoundConfigs.one;