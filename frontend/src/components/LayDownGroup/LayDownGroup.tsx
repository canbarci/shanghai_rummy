import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import axios from 'axios';
import './LayDownGroup.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

interface ValidationResult {
    isValid: boolean;
    mode: 'replace' | 'add-front' | 'add-back' | 'invalid';
}

interface LayDownGroupProps {
    groupKey: string;
    groups: Record<string, CardType[]>;
    playerHand: CardType[];
    playerId: string;
    laidDown: boolean;
    setGroups: React.Dispatch<React.SetStateAction<Record<string, CardType[]>>>;
    onCardRemove: (groupKey: string, index: number) => void;
    onGroupDrop: (index: number) => void;
    onHandDrop: (card: CardType) => void;
}

const LayDownGroup: React.FC<LayDownGroupProps> = ({
    groupKey, 
    groups, 
    playerHand, 
    playerId,
    laidDown, 
    setGroups,
    onCardRemove,
    onGroupDrop,
    onHandDrop
}) => {
    // Card validation helpers
    const findJokerPosition = (group: CardType[]): number => {
        return group.findIndex(card => card.value === 'JOKER');
    };

    const cardValueToNumber = (value: string): number => {
        const valueMap: {[key: string]: number} = {
            'ACE': 1, '2': 2, '3': 3, '4': 4, '5': 5, 
            '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 
            'JACK': 11, 'QUEEN': 12, 'KING': 13
        };
        return valueMap[value];
    };

    const isWrapAround = (value1: number, value2: number): boolean => {
        return (value1 === 1 && value2 === 13) || 
               (value1 === 13 && value2 === 1) ||
               (value1 === 14 && value2 === 2) || 
               (value1 === 2 && value2 === 14);
    };

    // Validation functions
    const validateBook = (
        droppedCard: CardType, 
        nonJokers: CardType[], 
        jokerIndex: number
    ): ValidationResult => {
        if (droppedCard.value !== nonJokers[0].value) {
            return { isValid: false, mode: 'invalid' };
        }
        return jokerIndex !== -1 
            ? { isValid: true, mode: 'replace' }
            : { isValid: true, mode: 'add-back' };
    };

    const validateJokerReplacement = (
        values: number[], 
        newValue: number, 
        jokerIndex: number, 
        isAscending: boolean
    ): ValidationResult => {
        if (jokerIndex === 0) {
            const expectedValue = isAscending ? values[0] - 1 : values[0] + 1;
            const expectedFrontValue = isAscending ? values[0] - 2 : values[0] + 2;
                
            if (newValue === expectedValue) return { isValid: true, mode: 'replace' };
            if (newValue === expectedFrontValue) return { isValid: true, mode: 'add-front' };
        } 
        else if (jokerIndex === values.length - 1) {
            const expectedValue = isAscending ? values[values.length - 1] + 1 : values[values.length - 1] - 1;
            const expectedBackValue = isAscending ? values[values.length - 1] + 2 : values[values.length - 1] - 2;
                
            if (newValue === expectedValue) return { isValid: true, mode: 'replace' };
            if (newValue === expectedBackValue) return { isValid: true, mode: 'add-back' };
        } 
        else {
            const expectedValue = isAscending ? values[jokerIndex - 1] + 1 : values[jokerIndex - 1] - 1;
            if (newValue === expectedValue) return { isValid: true, mode: 'replace' };
        }
        
        return { isValid: false, mode: 'invalid' };
    };

    const validateRun = (
        values: number[], 
        newValue: number, 
        isAscending: boolean
    ): ValidationResult => {
        const canAddFront = isAscending ? newValue === values[0] - 1 : newValue === values[0] + 1;
        const canAddBack = isAscending ? newValue === values[values.length - 1] + 1 : newValue === values[values.length - 1] - 1;
    
        if (canAddFront && !isWrapAround(newValue, values[0])) {
            return { isValid: true, mode: 'add-front' };
        }
        if (canAddBack && !isWrapAround(values[values.length - 1], newValue)) {
            return { isValid: true, mode: 'add-back' };
        }
        
        return { isValid: false, mode: 'invalid' };
    };

    const validateDrop = (
        droppedCard: CardType, 
        groupKey: string, 
        currentGroup: CardType[]
    ): ValidationResult => {
        const isBook = groupKey.includes('book');
        const jokerIndex = findJokerPosition(currentGroup);
        const nonJokers = currentGroup.filter(card => card.value !== 'JOKER');
        
        const values = nonJokers.map(card => {
            if (card.value === 'ACE') {
                const hasKing = nonJokers.some(c => c.value === 'KING');
                const hasTwo = nonJokers.some(c => c.value === '2');
                return hasKing ? 14 : hasTwo ? 1 : 1;
            }
            return cardValueToNumber(card.value);
        });
        
        const newValue = droppedCard.value === 'ACE'
            ? (values.includes(13) ? 14 : values.includes(2) ? 1 : 1)
            : cardValueToNumber(droppedCard.value);

        if (isBook) {
            return validateBook(droppedCard, nonJokers, jokerIndex);
        }

        if (droppedCard.suit !== nonJokers[0].suit) {
            return { isValid: false, mode: 'invalid' };
        }

        const isAscending = values[0] < values[1];

        if (jokerIndex !== -1) {
            const jokerResult = validateJokerReplacement(values, newValue, jokerIndex, isAscending);
            if (jokerResult.isValid) return jokerResult;
        }

        return validateRun(values, newValue, isAscending);
    };

    // Group update handling
    const handleGroupUpdate = async (updatedGroups: Record<string, CardType[]>) => {
        try {
            await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                groups: updatedGroups
            });
            setGroups(updatedGroups);
        } catch (error) {
            console.error("Error updating groups:", error);
            throw new Error("Failed to update groups");
        }
    };

    // Check player's laid down status
    const checkPlayerLaidDown = async (sourcePlayerId: string): Promise<boolean> => {
        try {
            const { data: laidDown } = await axios.get(
                `http://localhost:3001/api/player-hand/${sourcePlayerId}/laid-down`
            );
            return laidDown === true;
        } catch (error) {
            console.error("Error checking laid down status:", error);
            return false;
        }
    };

    // Check player's laid down status
    const checkPlayerCardDrawn = async (sourcePlayerId: string): Promise<boolean> => {
        try {
            const { data: cardDrawn } = await axios.get(
                `http://localhost:3001/api/player-hand/${sourcePlayerId}/card-drawn`
            );
            return cardDrawn === true;
        } catch (error) {
            console.error("Error checking card drawn status:", error);
            return false;
        }
    };

    // Drop handling
    const [{ isOver }, drop] = useDrop({
        accept: 'CARD',
        drop: async (item: { index: number; sourcePlayerId: string }) => {
            try {
                const isCardDrawn = await checkPlayerCardDrawn(item.sourcePlayerId); 
                if (!isCardDrawn) {
                    throw new Error("Can't add card to group (not player turn or haven't drawn card)");
                }
                
                // Validate drop from other player
                if (item.sourcePlayerId !== playerId) {
                    const isLaidDown = await checkPlayerLaidDown(item.sourcePlayerId);
                    if (!isLaidDown) {
                        throw new Error("Can't add card to group from player who hasn't laid down yet");
                    }
                }

                const droppedCard = playerHand[item.index];
                const currentGroup = groups[groupKey];
                const updatedGroups = { ...groups };

                // Handle pre-laid down drops
                if (!laidDown && item.sourcePlayerId === playerId) {
                    const newGroups = {
                        ...groups,
                        [groupKey]: [...groups[groupKey], droppedCard]
                    };
                    setGroups(newGroups);
                    onGroupDrop(item.index);
                    return { groupKey };
                }

                // Handle joker drops
                if (droppedCard.value === 'JOKER') {
                    if (findJokerPosition(currentGroup) !== -1) {
                        throw new Error('Joker already exists in group');
                    }
                    updatedGroups[groupKey] = currentGroup[currentGroup.length - 1].value === "ACE"
                        ? [droppedCard, ...currentGroup]
                        : [...currentGroup, droppedCard];
                } else {
                    // Handle regular card drops
                    const validation = validateDrop(droppedCard, groupKey, currentGroup);
                    if (!validation.isValid) return;

                    switch (validation.mode) {
                        case 'replace': {
                            const jokerIndex = findJokerPosition(currentGroup);
                            const joker = currentGroup[jokerIndex];
                            updatedGroups[groupKey] = [
                                ...currentGroup.slice(0, jokerIndex),
                                droppedCard,
                                ...currentGroup.slice(jokerIndex + 1)
                            ];
                            onHandDrop(joker);
                            break;
                        }
                        case 'add-front':
                            updatedGroups[groupKey] = [droppedCard, ...currentGroup];
                            break;
                        case 'add-back':
                            updatedGroups[groupKey] = [...currentGroup, droppedCard];
                            break;
                    }
                }

                await handleGroupUpdate(updatedGroups);
                onGroupDrop(item.index);
                return { groupKey };
            } catch (error) {
                const message = error instanceof Error ? error.message : "An error occurred while moving the card";
                console.error("Drop operation error:", error);
                alert(message);
                return;
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
        }),
    });

    // Card component with drag functionality
    const GroupCard = ({ card, index }: { card: CardType, index: number }) => {
        const [{ isDragging }, drag] = useDrag({
            type: 'CARD',
            item: { 
                index,
                sourcePlayerId: playerId
            },
            canDrag: () => !laidDown,
            end: (item, monitor) => {
                if (!monitor.didDrop() && onCardRemove) {
                    onCardRemove(groupKey, index);
                }
            },
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
        });

        return (
            <img
                ref={drag}
                src={card.image}
                alt={`${card.value} of ${card.suit}`}
                className={`card ${isDragging ? 'dragging' : ''}`}
                style={{ opacity: isDragging ? 0.5 : 1 }}
            />
        );
    };

    return (
        <div 
            ref={drop}
            className={`group-placeholder ${isOver ? 'drag-over' : ''}`}
        >
            {groups[groupKey].length === 0 ? (
                <div className="placeholder-box">Drop cards here</div>
            ) : (
                groups[groupKey].map((card, cardIndex) => (
                    <GroupCard
                        key={cardIndex}
                        card={card}
                        index={cardIndex}
                    />
                ))
            )}
        </div>
    );
};

export default LayDownGroup;