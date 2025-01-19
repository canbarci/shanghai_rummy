import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { RoundConfigs } from '../../config/roundConfigs.tsx';
import './LayDownGroups.css';

interface CardType {
    value: string;
    suit: string;
    image: string;
}

interface LayDownGroupsProps {
    playerHand: CardType[];
    onLayDown: (groups: Record<string, CardType[]>) => void;
    onCancel: () => void;
}

const LayDownGroups: React.FC<LayDownGroupsProps> = ({
    onLayDown,
    onCancel,
    playerHand
}) => {
    const [currentRound, setCurrentRound] = useState('one');
    const [groups, setGroups] = useState<Record<string, CardType[]>>(() => {
        const roundConfig = RoundConfigs[currentRound];
        return roundConfig.reduce((acc, config) => {
            for (let i = 0; i < config.maxGroups; i++) {
                acc[`${config.type}_${i + 1}`] = [];
            }
            return acc;
        }, {} as Record<string, CardType[]>);
    });

    const formatGroupLabel = (groupKey: string) => {
        const [type, number] = groupKey.split('_');
        return `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
    };

    const GroupPlaceholder = ({ groupKey }: { groupKey: string }) => {
        const [{ isOver }, drop] = useDrop({
            accept: 'CARD',
            drop: (item: { index: number }) => {
                const droppedCard = playerHand[item.index];
                setGroups(prevGroups => ({
                    ...prevGroups,
                    [groupKey]: [...prevGroups[groupKey], droppedCard]
                }));
                return { groupKey };
            },
            collect: monitor => ({
                isOver: !!monitor.isOver()
            })
        });

        return (
            <div 
                ref={drop} 
                className={`group-placeholder ${isOver ? 'drag-over' : ''}`}
            >
                {groups[groupKey].length === 0 ? (
                    <div className="placeholder-box">Drop cards here</div>
                ) : (
                    groups[groupKey].map((card, cardIndex) => (
                        <img
                            key={cardIndex}
                            src={card.image}
                            alt={`${card.value} of ${card.suit}`}
                            className="card"
                        />
                    ))
                )}
            </div>
        );
    };

    return (
        <div className="groups">
            {Object.keys(groups).map((groupKey) => (
                <div className="group" key={groupKey}>
                    <span className="group-label">{formatGroupLabel(groupKey)}</span>
                    <GroupPlaceholder groupKey={groupKey} />
                </div>
            ))}
            {/* <div className="group-actions">
                <button onClick={() => onLayDown(groups)}>Confirm</button>
                <button onClick={onCancel}>Cancel</button>
            </div> */}
        </div>
    );
};

export default LayDownGroups;