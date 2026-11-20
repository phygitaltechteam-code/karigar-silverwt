import React from 'react';
import {createRoot} from 'react-dom/client';
import {ConfirmModal} from '@/components/ui/ConfirmModal';

export const confirmAction = (
  title: string,
  message: React.ReactNode,
): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    const cleanup = () => {
      root.unmount();
      div.remove();
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    root.render(
      <ConfirmModal
        isOpen={true}
        title={title}
        message={message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );
  });
};
