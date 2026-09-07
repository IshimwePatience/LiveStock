import React from 'react';
import emptyMovementsImg from '../../assets/images/empty_movements.jpg';
import emptyDriveImg from '../../assets/images/empty_drive.jpg';

const EmptyState = ({
  illustration = 'drive', // 'movements' | 'drive'
  title = 'No items found',
  description = 'There are currently no records to display.',
  actionButton = null
}) => {
  const imgSrc = illustration === 'movements' ? emptyMovementsImg : emptyDriveImg;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center font-sans animate-in fade-in duration-300">
      <div className="w-64 h-48 mb-3 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-contain rounded-2xl"
        />
      </div>
      <h3 className="text-xl font-medium text-gray-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 max-w-md font-normal leading-relaxed mb-4">
        {description}
      </p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
