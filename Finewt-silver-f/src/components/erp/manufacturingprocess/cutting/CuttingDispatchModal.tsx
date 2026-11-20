import React from 'react';
import ProcessDispatchPopup from '../shared/ProcessDispatchPopup';
import { StockCardItem } from './AddCuttingStockModal';

interface CuttingDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStockCard: StockCardItem | null;
  onSuccess: () => Promise<void>;
}

export const CuttingDispatchModal: React.FC<CuttingDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedStockCard,
  onSuccess,
}) => {
  return (
    <ProcessDispatchPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Cutting Process"
      items={
        selectedStockCard
          ? [
              {
                id: selectedStockCard.id,
                purity: selectedStockCard.purity,
                availableWeight: selectedStockCard.weight,
                Stamp:
                  selectedStockCard.Stamp ||
                  selectedStockCard.stamp ||
                  '92.5',
                stamp:
                  selectedStockCard.Stamp ||
                  selectedStockCard.stamp ||
                  '92.5',
                designName:
                  selectedStockCard.itemName ||
                  selectedStockCard.design ||
                  '',
                design:
                  selectedStockCard.itemName ||
                  selectedStockCard.design ||
                  '',
                size:
                  selectedStockCard.sizeName &&
                  selectedStockCard.sizeName !== '-'
                    ? selectedStockCard.sizeName
                    : (selectedStockCard as any).size || '',
                qty:
                  selectedStockCard.qty ||
                  (selectedStockCard as any).quantity ||
                  (selectedStockCard as any).chainReceivedQty ||
                  '',
                description:
                  selectedStockCard.itemName ||
                  selectedStockCard.description ||
                  (selectedStockCard.sizeName &&
                  selectedStockCard.sizeName !== '-'
                    ? `Size: ${selectedStockCard.sizeName}`
                    : 'Cutting Stock'),
              },
            ]
          : []
      }
      nextProcessOptions={['Wash']}
      onSuccess={onSuccess}
    />
  );
};

export default CuttingDispatchModal;
