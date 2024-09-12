import './PlayerHand.css';
import React, { useEffect, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

interface Card {
    value: string;
    suit: string;
    image: string;
}

interface CardProps {
    card: Card;
    index: number;
    moveCard: (dragIndex: number, hoverIndex: number) => void;
}

const Card: React.FC<CardProps> = ({ card, index, moveCard }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'CARD',
        item: { index },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: 'CARD',
        hover: (draggedItem: { index: number }) => {
            if (draggedItem.index !== index) {
                moveCard(draggedItem.index, index);
            }
        },
    });

    return (
        <div
            ref={(node) => drag(drop(node))}
            style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
        >
            <img src={card.image} alt={`${card.value} of ${card.suit}`} />
        </div>
    );
};
  
const PlayerHand = () => {
    const db = getDatabase();
    const cardsDeltRef = ref(db, `game/cardsDelt`);
    const deckIdRef = ref(db, `game/deck/deck_id`)
    const nameRef = ref(db, `players/${getAuth().currentUser?.uid}/playerName`);
    const handRef = ref(db, `players/${getAuth().currentUser?.uid}/hand`);
    const remainingRef = ref(db, `game/deck/remaining`);
    const [deckId, setDeckId] = useState(null);
    const [name, setName] = useState(null);
    const [hand, setHand] = useState<Card[]>([]);

    useEffect(() => {
        onValue(cardsDeltRef, (snapshot) => {
            const cardsDelt = snapshot.val();
            if (cardsDelt === true) {
                getID()
                getName()
                getHands()
            }
        })
      }, [deckId]);  

    useEffect(() => {
        onValue(handRef, (snapshot) => {
            const hand = snapshot.val();
            if (hand) {
                setHand(hand);
            }
        })
    }, [deckId]); 

    const getID = () => {
        get(deckIdRef)
            .then((snapshot) => {
                setDeckId(snapshot.val())
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const getName = () => {
        get(nameRef)
            .then((snapshot) => {
                setName(snapshot.val())
            })
            .catch((error) => {
                console.error(error);
            });
    }

    const getHands = () => {
        if (deckId) {
            axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=11`)
                .then(response => {
                    const hand = response.data.cards
                    const remainingCards = response.data.remaining

                    set(handRef, hand)
                    set(remainingRef, remainingCards);

                    setHand(hand)
                    console.log(response.data)
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    const moveCard = (dragIndex: number, hoverIndex: number) => {
        const newHand = [...hand];
        const draggedCard = newHand[dragIndex];
    
        // Reorder the cards
        newHand.splice(dragIndex, 1);
        newHand.splice(hoverIndex, 0, draggedCard);
    
        // Update the state with the new order
        setHand(newHand);
    
        // // Update the database with the new order (if needed)
        set(handRef, newHand);
    };
  
    return (
        <DndProvider backend={HTML5Backend}>
            <main>
                <h1 className="player-name">
                    {name}
                </h1>
                <div className="player-hand">
                    {hand.map((card: Card, index: number) => (
                      <Card key={index} card={card} index={index} moveCard={moveCard} />
                    ))}
                </div>
            </main>
        </DndProvider>
    );
};

export default PlayerHand