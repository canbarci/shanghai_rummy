import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import axios from 'axios';
import './LayDownGroup.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
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

    const validateDrop = (droppedCard: CardType, groupKey: string, currentGroup: CardType[]): { 
        isValid: boolean; 
        mode: 'replace' | 'add-front' | 'add-back' | 'invalid' 
    } => {
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
        const newValue = droppedCard.value === 'ACE' ?
            (values.includes(13) ? 14 : values.includes(2) ? 1 : 1) :
            cardValueToNumber(droppedCard.value);
    
        // Book validation
        if (isBook) {
            if (nonJokers.length > 0 && droppedCard.value !== nonJokers[0].value) {
                return { isValid: false, mode: 'invalid' };
            }
            return jokerIndex !== -1 ? { isValid: true, mode: 'replace' } : { isValid: true, mode: 'add-back' };
        }
    
        // Run validation
        if (nonJokers.length > 0 && droppedCard.suit !== nonJokers[0].suit) {
            return { isValid: false, mode: 'invalid' };
        }

        // Invalid combinations for runs involving Ace/King/Two
        console.log(values[0]);
        console.log(newValue);
        // FIX ASCENDING VS DESCENDING
        if ((values[0] === 1 || values[values.length - 1] === 1) && newValue === 13) return { isValid: false, mode: 'invalid' };
        if ((values[0] === 14 || values[values.length - 1] === 14) && newValue === 2) return { isValid: false, mode: 'invalid' };
    
        // No joker case
        if (jokerIndex === -1) {
            if (newValue === values[0] + 1) return { isValid: true, mode: 'add-front' };
            if (newValue === values[values.length - 1] - 1) return { isValid: true, mode: 'add-back' };
            return { isValid: false, mode: 'invalid' };
        }
    
        // Joker cases
        if (jokerIndex === 0) {
            // Joker at start
            if (newValue === values[0] + 1) return { isValid: true, mode: 'replace' };
            if (newValue === values[0] + 2) return { isValid: true, mode: 'add-front' };
        } else if (jokerIndex === currentGroup.length - 1) {
            // Joker at end
            if (newValue === values[values.length - 1] - 1) return { isValid: true, mode: 'replace' };
            if (newValue === values[values.length - 1] - 2) return { isValid: true, mode: 'add-back' };
        } else {
            // Joker in middle
            if (Math.abs(values[jokerIndex] - values[jokerIndex - 1]) === 2 && 
                newValue === values[jokerIndex - 1] - 1) {
                return { isValid: true, mode: 'replace' };
            }
        }
    
        // If can't replace joker, check ends
        if (newValue === values[0] + 1) return { isValid: true, mode: 'add-front' };
        if (newValue === values[values.length - 1] - 1) return { isValid: true, mode: 'add-back' };
    
        return { isValid: false, mode: 'invalid' };
    };

    const [{ isOver }, drop] = useDrop({
        accept: 'CARD',
        drop: async (item: { index: number }) => {
            const droppedCard = playerHand[item.index];
            
            if (laidDown) {
                const currentGroup = groups[groupKey];
                const updatedGroups = { ...groups };
        
                if (droppedCard.value === 'JOKER') {
                    const jokerIndex = findJokerPosition(currentGroup);
                    if (jokerIndex !== -1) {
                        alert('Joker already exists in group');
                        return;
                    }
                    updatedGroups[groupKey] = [...currentGroup, droppedCard];
                } else {
                    const validation = validateDrop(droppedCard, groupKey, currentGroup);
                    
                    if (!validation.isValid) return;
    
                    switch (validation.mode) {
                        case 'replace':
                            const jokerIndex = findJokerPosition(currentGroup);
                            const joker = currentGroup[jokerIndex];
                            updatedGroups[groupKey] = [
                                ...currentGroup.slice(0, jokerIndex),
                                droppedCard,
                                ...currentGroup.slice(jokerIndex + 1)
                            ];
                            onHandDrop(joker);
                            break;
                        case 'add-front':
                            updatedGroups[groupKey] = [droppedCard, ...currentGroup];
                            break;
                        case 'add-back':
                            updatedGroups[groupKey] = [...currentGroup, droppedCard];
                            break;
                    }
                }
                setGroups(updatedGroups);

                await axios.post(`http://localhost:3001/api/lay-down-groups/${playerId}/update`, {
                    groups: updatedGroups
                });

                onGroupDrop(item.index);
                return { groupKey };
            } else {
                setGroups(prevGroups => ({
                    ...prevGroups,
                    [groupKey]: [...prevGroups[groupKey], droppedCard]
                }));
                onGroupDrop(item.index);
                return { groupKey };
            }
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
        }),
    });

    const GroupCard = ({ card, index }: { card: CardType, index: number }) => {
        const [{ isDragging }, drag] = useDrag({
            type: 'CARD',
            item: { index },
            canDrag: () => !laidDown,
            end: (item, monitor) => {
                // If dropped outside, remove from group
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