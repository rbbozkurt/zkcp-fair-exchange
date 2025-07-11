import React from 'react';

interface PrivateKeyExportModalProps {
  privateKeyPEM: string;
  onClose: () => void;
}

export const PrivateKeyExportModal: React.FC<PrivateKeyExportModalProps> = ({
  privateKeyPEM,
  onClose,
}) => {
  // Download handler
  const handleDownload = () => {
    const blob = new Blob([privateKeyPEM], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zkcp_private_key.pem';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
        <h2 className="text-xl font-bold mb-4 text-red-600">Backup Your Private Key</h2>
        <p className="mb-4 text-gray-700">
          <b>Important:</b> This private key is required to decrypt your purchased files. If you
          lose it, you will <span className="text-red-500 font-bold">not</span> be able to access
          your data. Please download and store it securely.
        </p>
        <textarea
          className="w-full h-32 p-2 border rounded bg-gray-100 font-mono text-xs mb-4"
          value={privateKeyPEM}
          readOnly
        />
        <div className="flex justify-between items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
            onClick={handleDownload}
          >
            Download Private Key
          </button>
          <button className="ml-4 text-gray-600 hover:text-black underline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
