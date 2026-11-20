import React from 'react';
import ProcessDispatchPopup from '../shared/ProcessDispatchPopup';

interface SolderingStockCardItem {
  id: string;
  purity: number;
  stamp: string;
  availableWeight: number;
  totalWeight: number;
  design?: string;
  description?: string;
  qty?: number | string;
}

interface SolderingDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCard: SolderingStockCardItem | null;
  stockCards: SolderingStockCardItem[];
  setStockCards: React.Dispatch<React.SetStateAction<SolderingStockCardItem[]>>;
}

export const SolderingDispatchModal: React.FC<SolderingDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedCard,
  stockCards,
  setStockCards,
}) => {
  return (
    <ProcessDispatchPopup
      isOpen={isOpen}
      onClose={onClose}
      showDesign
      title="Soldering Process"
      items={
        selectedCard
          ? [
              {
                id: selectedCard.id,
                purity: selectedCard.purity,
                availableWeight:
                  selectedCard.availableWeight ??
                  selectedCard.totalWeight,
                stamp: selectedCard.stamp,
                Stamp: selectedCard.stamp,
                designName: selectedCard.stamp || '',
                design: selectedCard.design || selectedCard.description || '',
                description: selectedCard.description || selectedCard.design || '',
                qty: selectedCard.qty,
              },
            ]
          : []
      }
      nextProcessOptions={['Polishing', 'Wash', 'Meena', 'Tass']}
      onSuccess={(payload) => {
        const usedWeight = payload.weight || 0;
        const cardId = payload.itemId;

        const newStockCards = [...stockCards];
        const cardIndex = newStockCards.findIndex((c) => c.id === cardId);
        if (cardIndex > -1) {
          const card = newStockCards[cardIndex];
          const currentTotal = card.availableWeight ?? card.totalWeight ?? 0;
          const remaining = Math.max(
            0,
            Math.round((currentTotal - usedWeight) * 1000) / 1000,
          );
          if (remaining <= 0) newStockCards.splice(cardIndex, 1);
          else
            newStockCards[cardIndex] = {
              ...card,
              availableWeight: remaining,
              totalWeight: remaining,
            };
          setStockCards(newStockCards);
          try {
            localStorage.setItem(
              'chain_soldering_stock_cards_v2',
              JSON.stringify(newStockCards),
            );
          } catch (e) {}
        }
      }}
    />
  );
};

export default SolderingDispatchModal;
